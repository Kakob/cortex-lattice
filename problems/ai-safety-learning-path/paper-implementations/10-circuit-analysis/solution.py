"""Transformer Circuit Analysis"""
import torch
import numpy as np
from typing import List, Dict, Tuple

class CircuitAnalyzer:
    """Analyze circuits in transformer models."""
    
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer
        self.attention_patterns = {}
    
    def get_attention_patterns(self, text: str) -> Dict[str, torch.Tensor]:
        """Extract attention patterns from all layers/heads."""
        inputs = self.tokenizer(text, return_tensors="pt")
        
        with torch.no_grad():
            outputs = self.model(**inputs, output_attentions=True)
        
        patterns = {}
        for layer_idx, layer_attn in enumerate(outputs.attentions):
            for head_idx in range(layer_attn.shape[1]):
                key = f"L{layer_idx}H{head_idx}"
                patterns[key] = layer_attn[0, head_idx].cpu()
        
        return patterns
    
    def find_induction_heads(self, patterns: Dict) -> List[str]:
        """Find heads that copy patterns from earlier in sequence."""
        induction_heads = []
        
        for key, attn in patterns.items():
            # Induction: strong attention to position i-1 when token at i matches token at j
            # Simplified: look for diagonal-like patterns offset by 1
            diag_score = self._diagonal_score(attn, offset=1)
            if diag_score > 0.3:
                induction_heads.append(key)
        
        return induction_heads
    
    def _diagonal_score(self, attn: torch.Tensor, offset: int = 0) -> float:
        """Measure how diagonal the attention pattern is."""
        n = attn.shape[0]
        if n <= offset:
            return 0.0
        
        diag_sum = 0.0
        for i in range(offset, n):
            diag_sum += attn[i, i - offset].item()
        
        return diag_sum / (n - offset)
    
    def path_patch(self, clean_text: str, corrupted_text: str, 
                   component: str) -> float:
        """Measure causal effect of a component via path patching."""
        # Get clean activations
        clean_acts = self._get_component_activation(clean_text, component)
        
        # Run corrupted input but patch in clean activation
        corrupted_output = self._run_with_patch(corrupted_text, component, clean_acts)
        clean_output = self.model.generate(self.tokenizer(clean_text, return_tensors="pt").input_ids)
        
        # Measure effect
        effect = self._compare_outputs(clean_output, corrupted_output)
        return effect
    
    def _get_component_activation(self, text, component):
        # Placeholder for hook-based activation extraction
        return None
    
    def _run_with_patch(self, text, component, activation):
        # Placeholder for patching run
        return None
    
    def _compare_outputs(self, a, b):
        return 0.0

def analyze_attention_composition(patterns: Dict) -> Dict:
    """Analyze how attention heads compose."""
    composition = {}
    
    layers = set(k.split("H")[0] for k in patterns.keys())
    
    for l1 in sorted(layers):
        for l2 in sorted(layers):
            if l1 >= l2:
                continue
            
            # Find heads in each layer that compose
            l1_heads = [k for k in patterns if k.startswith(l1)]
            l2_heads = [k for k in patterns if k.startswith(l2)]
            
            for h1 in l1_heads:
                for h2 in l2_heads:
                    # Composition score: how much does h2 attend to h1's outputs?
                    score = (patterns[h1] @ patterns[h2].T).mean().item()
                    composition[f"{h1}->{h2}"] = score
    
    return composition
