"""KV Cache System for Efficient Inference"""
import torch
from typing import Optional, Tuple, List

class KVCache:
    """Key-Value cache for transformer attention."""
    
    def __init__(self, max_seq_len: int, num_layers: int, num_heads: int, 
                 head_dim: int, dtype=torch.float16):
        self.max_seq_len = max_seq_len
        self.num_layers = num_layers
        self.num_heads = num_heads
        self.head_dim = head_dim
        self.dtype = dtype
        
        # Preallocate cache tensors
        self.k_cache = torch.zeros(
            num_layers, max_seq_len, num_heads, head_dim, dtype=dtype
        )
        self.v_cache = torch.zeros(
            num_layers, max_seq_len, num_heads, head_dim, dtype=dtype
        )
        
        self.seq_len = 0
    
    def update(self, layer_idx: int, new_k: torch.Tensor, new_v: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """Add new K, V to cache and return full K, V."""
        batch_size, new_tokens, num_heads, head_dim = new_k.shape
        
        # Store new values
        self.k_cache[layer_idx, self.seq_len:self.seq_len + new_tokens] = new_k.squeeze(0)
        self.v_cache[layer_idx, self.seq_len:self.seq_len + new_tokens] = new_v.squeeze(0)
        
        # Return full cached values
        full_k = self.k_cache[layer_idx, :self.seq_len + new_tokens].unsqueeze(0)
        full_v = self.v_cache[layer_idx, :self.seq_len + new_tokens].unsqueeze(0)
        
        return full_k, full_v
    
    def advance(self, num_tokens: int = 1):
        """Advance the sequence position."""
        self.seq_len += num_tokens
    
    def reset(self):
        """Clear the cache."""
        self.k_cache.zero_()
        self.v_cache.zero_()
        self.seq_len = 0

class EfficientGeneration:
    """Generation with KV caching."""
    
    def __init__(self, model, tokenizer, max_length: int = 2048):
        self.model = model
        self.tokenizer = tokenizer
        self.max_length = max_length
        
        # Get model config
        config = model.config
        self.cache = KVCache(
            max_seq_len=max_length,
            num_layers=config.num_hidden_layers,
            num_heads=config.num_attention_heads,
            head_dim=config.hidden_size // config.num_attention_heads
        )
    
    def generate(self, prompt: str, max_new_tokens: int = 100) -> str:
        """Generate with KV caching."""
        self.cache.reset()
        
        # Tokenize prompt
        input_ids = self.tokenizer(prompt, return_tensors="pt").input_ids
        prompt_len = input_ids.shape[1]
        
        # Process prompt (fills cache)
        with torch.no_grad():
            outputs = self.model(input_ids, use_cache=True)
            # Store initial cache
            past_key_values = outputs.past_key_values
        
        generated = input_ids
        
        # Generate tokens one at a time
        for _ in range(max_new_tokens):
            # Only process the last token (use cached context)
            with torch.no_grad():
                outputs = self.model(
                    generated[:, -1:],
                    past_key_values=past_key_values,
                    use_cache=True
                )
            
            # Update cache
            past_key_values = outputs.past_key_values
            
            # Sample next token
            logits = outputs.logits[:, -1, :]
            next_token = torch.argmax(logits, dim=-1, keepdim=True)
            
            generated = torch.cat([generated, next_token], dim=1)
            
            # Check for EOS
            if next_token.item() == self.tokenizer.eos_token_id:
                break
        
        return self.tokenizer.decode(generated[0], skip_special_tokens=True)

def benchmark_with_without_cache(model, tokenizer, prompts: List[str]) -> dict:
    """Compare generation speed with and without caching."""
    import time
    
    # With cache
    gen = EfficientGeneration(model, tokenizer)
    start = time.time()
    for prompt in prompts:
        gen.generate(prompt, max_new_tokens=50)
    cached_time = time.time() - start
    
    # Without cache (recompute everything)
    start = time.time()
    for prompt in prompts:
        inputs = tokenizer(prompt, return_tensors="pt")
        model.generate(**inputs, max_new_tokens=50, use_cache=False)
    no_cache_time = time.time() - start
    
    return {
        "with_cache": cached_time,
        "without_cache": no_cache_time,
        "speedup": no_cache_time / cached_time
    }
