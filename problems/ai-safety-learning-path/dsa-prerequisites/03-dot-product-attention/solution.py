from typing import List
import math

def scaled_dot_product_attention(
    Q: List[List[float]], 
    K: List[List[float]], 
    V: List[List[float]],
    d_k: int
) -> List[List[float]]:
    """
    Compute scaled dot-product attention.
    
    Formula: Attention(Q, K, V) = softmax(Q @ K^T / √d_k) @ V
    
    Steps:
    1. Compute attention scores: Q @ K^T
    2. Scale by √d_k to prevent softmax saturation
    3. Apply softmax to get attention weights
    4. Multiply by V to get output
    
    Time Complexity: O(n² × d)
    Space Complexity: O(n²) for attention matrix
    """
    seq_len_q = len(Q)
    seq_len_k = len(K)
    d_v = len(V[0]) if V else 0
    
    # Step 1: Compute Q @ K^T (attention scores)
    scores = [[0.0] * seq_len_k for _ in range(seq_len_q)]
    for i in range(seq_len_q):
        for j in range(seq_len_k):
            dot = sum(Q[i][d] * K[j][d] for d in range(d_k))
            scores[i][j] = dot
    
    # Step 2: Scale by sqrt(d_k)
    scale = math.sqrt(d_k)
    for i in range(seq_len_q):
        for j in range(seq_len_k):
            scores[i][j] /= scale
    
    # Step 3: Apply softmax to each row
    def softmax(row):
        max_val = max(row)
        exp_vals = [math.exp(x - max_val) for x in row]
        total = sum(exp_vals)
        return [e / total for e in exp_vals]
    
    attention_weights = [softmax(row) for row in scores]
    
    # Step 4: Multiply by V
    output = [[0.0] * d_v for _ in range(seq_len_q)]
    for i in range(seq_len_q):
        for j in range(d_v):
            for k in range(seq_len_k):
                output[i][j] += attention_weights[i][k] * V[k][j]
    
    return output


def attention_with_mask(Q, K, V, d_k, mask=None):
    """
    Attention with optional masking (for causal/decoder attention).
    
    mask[i][j] = True means position i cannot attend to position j
    (used in autoregressive models to prevent looking at future tokens)
    """
    seq_len_q = len(Q)
    seq_len_k = len(K)
    d_v = len(V[0]) if V else 0
    
    # Compute scores
    scores = [[0.0] * seq_len_k for _ in range(seq_len_q)]
    for i in range(seq_len_q):
        for j in range(seq_len_k):
            dot = sum(Q[i][d] * K[j][d] for d in range(d_k))
            scores[i][j] = dot / math.sqrt(d_k)
    
    # Apply mask (set masked positions to -inf)
    if mask:
        for i in range(seq_len_q):
            for j in range(seq_len_k):
                if mask[i][j]:
                    scores[i][j] = float('-inf')
    
    # Softmax
    def softmax(row):
        max_val = max(x for x in row if x != float('-inf'))
        exp_vals = [math.exp(x - max_val) if x != float('-inf') else 0 for x in row]
        total = sum(exp_vals)
        return [e / total if total > 0 else 0 for e in exp_vals]
    
    attention_weights = [softmax(row) for row in scores]
    
    # Output
    output = [[0.0] * d_v for _ in range(seq_len_q)]
    for i in range(seq_len_q):
        for j in range(d_v):
            for k in range(seq_len_k):
                output[i][j] += attention_weights[i][k] * V[k][j]
    
    return output


if __name__ == "__main__":
    # Test case
    Q = [[1, 0], [0, 1]]
    K = [[1, 0], [0, 1]]
    V = [[1, 2], [3, 4]]
    d_k = 2
    
    result = scaled_dot_product_attention(Q, K, V, d_k)
    print("Attention output:")
    for row in result:
        print([round(x, 2) for x in row])
