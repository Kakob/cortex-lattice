from typing import List
import random
import math

def softmax(logits: List[float], temperature: float = 1.0) -> List[float]:
    """Softmax with temperature scaling."""
    scaled = [x / temperature for x in logits]
    max_val = max(scaled)
    exp_vals = [math.exp(x - max_val) for x in scaled]
    total = sum(exp_vals)
    return [e / total for e in exp_vals]


def top_k_sample(logits: List[float], k: int, temperature: float = 1.0) -> int:
    """
    Top-K sampling: Sample from the k most probable tokens.
    
    1. Apply temperature scaling
    2. Find top k indices
    3. Zero out all other probabilities
    4. Renormalize and sample
    
    Time: O(n log n) for sorting
    Space: O(n)
    """
    probs = softmax(logits, temperature)
    
    # Get indices sorted by probability (descending)
    indexed_probs = [(i, p) for i, p in enumerate(probs)]
    indexed_probs.sort(key=lambda x: x[1], reverse=True)
    
    # Keep only top k
    top_k = indexed_probs[:k]
    
    # Renormalize
    total = sum(p for _, p in top_k)
    normalized = [(i, p / total) for i, p in top_k]
    
    # Sample
    r = random.random()
    cumsum = 0
    for idx, prob in normalized:
        cumsum += prob
        if r <= cumsum:
            return idx
    
    return normalized[-1][0]  # Fallback


def top_p_sample(logits: List[float], p: float, temperature: float = 1.0) -> int:
    """
    Top-P (nucleus) sampling: Sample from smallest set with cumprob >= p.
    
    More adaptive than top-k:
    - For peaked distributions: few tokens selected
    - For flat distributions: more tokens selected
    
    Time: O(n log n) for sorting
    Space: O(n)
    """
    probs = softmax(logits, temperature)
    
    # Sort by probability descending
    indexed_probs = [(i, prob) for i, prob in enumerate(probs)]
    indexed_probs.sort(key=lambda x: x[1], reverse=True)
    
    # Find smallest set with cumulative prob >= p
    cumsum = 0
    nucleus = []
    for idx, prob in indexed_probs:
        nucleus.append((idx, prob))
        cumsum += prob
        if cumsum >= p:
            break
    
    # Renormalize over nucleus
    total = sum(prob for _, prob in nucleus)
    normalized = [(idx, prob / total) for idx, prob in nucleus]
    
    # Sample
    r = random.random()
    cumsum = 0
    for idx, prob in normalized:
        cumsum += prob
        if r <= cumsum:
            return idx
    
    return normalized[-1][0]


def top_k_top_p_sample(logits: List[float], k: int, p: float, 
                       temperature: float = 1.0) -> int:
    """Combined top-k and top-p sampling (common in practice)."""
    probs = softmax(logits, temperature)
    
    # Sort descending
    indexed_probs = [(i, prob) for i, prob in enumerate(probs)]
    indexed_probs.sort(key=lambda x: x[1], reverse=True)
    
    # Apply top-k first
    top_k_probs = indexed_probs[:k]
    
    # Then apply top-p
    cumsum = 0
    nucleus = []
    for idx, prob in top_k_probs:
        nucleus.append((idx, prob))
        cumsum += prob
        if cumsum >= p:
            break
    
    # Renormalize and sample
    total = sum(prob for _, prob in nucleus)
    normalized = [(idx, prob / total) for idx, prob in nucleus]
    
    r = random.random()
    cumsum = 0
    for idx, prob in normalized:
        cumsum += prob
        if r <= cumsum:
            return idx
    
    return normalized[-1][0]


if __name__ == "__main__":
    # Test with a peaked distribution
    logits_peaked = [10.0, 5.0, 2.0, 1.0, 0.5]
    print("Peaked distribution:")
    print(f"  Probs: {[round(p, 3) for p in softmax(logits_peaked)]}")
    
    # Sample multiple times
    samples_k = [top_k_sample(logits_peaked, k=2) for _ in range(10)]
    samples_p = [top_p_sample(logits_peaked, p=0.9) for _ in range(10)]
    print(f"  Top-k=2 samples: {samples_k}")
    print(f"  Top-p=0.9 samples: {samples_p}")
    
    # Test with flat distribution
    logits_flat = [1.0, 1.0, 1.0, 1.0, 1.0]
    print("\nFlat distribution:")
    print(f"  Probs: {[round(p, 3) for p in softmax(logits_flat)]}")
    samples_k = [top_k_sample(logits_flat, k=2) for _ in range(10)]
    samples_p = [top_p_sample(logits_flat, p=0.9) for _ in range(10)]
    print(f"  Top-k=2 samples: {samples_k}")
    print(f"  Top-p=0.9 samples: {samples_p}")
