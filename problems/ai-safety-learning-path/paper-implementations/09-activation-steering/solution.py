"""Activation Steering Implementation"""
import torch
import numpy as np
from typing import Dict, List, Tuple

class ActivationSteering:
    """Control model behavior via activation manipulation."""
    
    def __init__(self, model, layer_index: int = -1):
        self.model = model
        self.layer_index = layer_index
        self.steering_vectors: Dict[str, torch.Tensor] = {}
        self.activations = {}
    
    def extract_activations(self, text: str) -> torch.Tensor:
        """Get activations at specified layer."""
        def hook(module, input, output):
            self.activations["hidden"] = output[0].detach()
        
        layer = self.model.transformer.h[self.layer_index]
        handle = layer.register_forward_hook(hook)
        
        inputs = self.model.tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            self.model(**inputs)
        
        handle.remove()
        return self.activations["hidden"]
    
    def compute_steering_vector(self, positive_examples: List[str], 
                                negative_examples: List[str]) -> torch.Tensor:
        """Compute steering vector as difference of mean activations."""
        pos_acts = [self.extract_activations(ex).mean(dim=1) for ex in positive_examples]
        neg_acts = [self.extract_activations(ex).mean(dim=1) for ex in negative_examples]
        
        pos_mean = torch.stack(pos_acts).mean(dim=0)
        neg_mean = torch.stack(neg_acts).mean(dim=0)
        
        return pos_mean - neg_mean
    
    def add_steering(self, concept: str, vector: torch.Tensor):
        """Store steering vector for a concept."""
        self.steering_vectors[concept] = vector
    
    def generate_steered(self, prompt: str, concept: str, 
                        strength: float = 1.0, **kwargs) -> str:
        """Generate with activation steering applied."""
        if concept not in self.steering_vectors:
            raise ValueError(f"No steering vector for {concept}")
        
        vector = self.steering_vectors[concept] * strength
        
        def steering_hook(module, input, output):
            modified = output[0] + vector.to(output[0].device)
            return (modified,) + output[1:]
        
        layer = self.model.transformer.h[self.layer_index]
        handle = layer.register_forward_hook(steering_hook)
        
        inputs = self.model.tokenizer(prompt, return_tensors="pt")
        output = self.model.generate(**inputs, **kwargs)
        
        handle.remove()
        return self.model.tokenizer.decode(output[0])

def find_concept_direction(model, concept_pairs: List[Tuple[str, str]]) -> torch.Tensor:
    """Find direction representing a concept from contrast pairs."""
    steerer = ActivationSteering(model)
    
    directions = []
    for pos, neg in concept_pairs:
        pos_act = steerer.extract_activations(pos).mean(dim=1)
        neg_act = steerer.extract_activations(neg).mean(dim=1)
        directions.append(pos_act - neg_act)
    
    # Average directions
    return torch.stack(directions).mean(dim=0)
