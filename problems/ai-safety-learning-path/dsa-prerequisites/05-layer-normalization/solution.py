from typing import List
import math

def layer_norm(
    x: List[List[float]], 
    gamma: List[float], 
    beta: List[float],
    eps: float = 1e-5
) -> List[List[float]]:
    """
    Layer Normalization: normalize over the last dimension.
    
    Formula: LayerNorm(x) = γ × (x - μ) / √(σ² + ε) + β
    
    Key insight: Unlike BatchNorm, LayerNorm:
    - Normalizes across features (not across batch)
    - Works the same in training and inference
    - Doesn't depend on batch size
    
    Time: O(n × d)
    Space: O(n × d)
    """
    result = []
    d = len(x[0])
    
    for row in x:
        # Compute mean
        mean = sum(row) / d
        
        # Compute variance
        variance = sum((val - mean) ** 2 for val in row) / d
        
        # Normalize
        std = math.sqrt(variance + eps)
        normalized = [(val - mean) / std for val in row]
        
        # Scale and shift
        output = [gamma[i] * normalized[i] + beta[i] for i in range(d)]
        result.append(output)
    
    return result


def layer_norm_backward(x, gamma, dy, eps=1e-5):
    """
    Backward pass for layer normalization.
    Returns gradients for x, gamma, and beta.
    """
    # This is more complex - needed for training
    pass


if __name__ == "__main__":
    x = [[1, 2, 3], [4, 5, 6]]
    gamma = [1, 1, 1]
    beta = [0, 0, 0]
    
    result = layer_norm(x, gamma, beta)
    print("Layer Norm output:")
    for row in result:
        print([round(v, 4) for v in row])
