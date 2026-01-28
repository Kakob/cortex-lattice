from typing import List

def attention_alignment(Q: List[List[float]], K: List[List[float]]) -> List[List[float]]:
    """
    Compute attention alignment scores: A = Q @ K^T
    
    This is the foundational operation in transformer attention mechanisms.
    We compute the dot product between each query vector and each key vector.
    
    Time Complexity: O(n * m * k) where Q is (n x k) and K is (m x k)
    Space Complexity: O(n * m) for the output matrix
    
    Args:
        Q: Query matrix of shape (seq_len_q, d_k)
        K: Key matrix of shape (seq_len_k, d_k)
    
    Returns:
        Attention alignment matrix of shape (seq_len_q, seq_len_k)
    """
    # Get dimensions
    seq_len_q = len(Q)
    seq_len_k = len(K)
    d_k = len(Q[0]) if Q else 0
    
    # Initialize output matrix
    # Shape: (seq_len_q, seq_len_k)
    result = [[0.0] * seq_len_k for _ in range(seq_len_q)]
    
    # Compute Q @ K^T
    # For each query position i and key position j,
    # compute dot product of Q[i] and K[j]
    for i in range(seq_len_q):
        for j in range(seq_len_k):
            # Dot product of Q[i] and K[j]
            dot_product = 0.0
            for d in range(d_k):
                dot_product += Q[i][d] * K[j][d]
            result[i][j] = dot_product
    
    return result


def attention_alignment_numpy(Q, K):
    """
    NumPy implementation - what you'd actually use in practice.
    
    import numpy as np
    return np.matmul(Q, K.T)
    """
    import numpy as np
    Q = np.array(Q)
    K = np.array(K)
    return (Q @ K.T).tolist()


def attention_alignment_pytorch(Q, K):
    """
    PyTorch implementation - used in actual transformers.
    
    import torch
    return torch.matmul(Q, K.transpose(-2, -1))
    """
    import torch
    Q = torch.tensor(Q)
    K = torch.tensor(K)
    return torch.matmul(Q, K.transpose(-2, -1)).tolist()


# Visualization helper for understanding
def visualize_attention_computation(Q, K):
    """
    Shows step-by-step how attention alignment is computed.
    """
    print("=" * 50)
    print("ATTENTION ALIGNMENT COMPUTATION")
    print("=" * 50)
    
    print(f"\nQuery Matrix Q ({len(Q)} x {len(Q[0])}):")
    for row in Q:
        print(f"  {row}")
    
    print(f"\nKey Matrix K ({len(K)} x {len(K[0])}):")
    for row in K:
        print(f"  {row}")
    
    print(f"\nK^T (transposed) ({len(K[0])} x {len(K)}):")
    K_T = [[K[j][i] for j in range(len(K))] for i in range(len(K[0]))]
    for row in K_T:
        print(f"  {row}")
    
    print("\n" + "-" * 50)
    print("Computing Q @ K^T:")
    print("-" * 50)
    
    result = attention_alignment(Q, K)
    
    for i in range(len(Q)):
        for j in range(len(K)):
            terms = [f"{Q[i][d]}*{K[j][d]}" for d in range(len(Q[0]))]
            dot = sum(Q[i][d] * K[j][d] for d in range(len(Q[0])))
            print(f"  A[{i}][{j}] = Q[{i}] · K[{j}] = {' + '.join(terms)} = {dot}")
    
    print(f"\nResult Matrix A ({len(result)} x {len(result[0])}):")
    for row in result:
        print(f"  {row}")
    
    return result


if __name__ == "__main__":
    # Test cases
    print("Test 1: Identity-like matrices")
    Q1 = [[1, 0], [0, 1]]
    K1 = [[1, 2], [3, 4]]
    result1 = visualize_attention_computation(Q1, K1)
    assert result1 == [[1, 3], [2, 4]], f"Expected [[1, 3], [2, 4]], got {result1}"
    print("✓ Passed\n")
    
    print("Test 2: Different shapes")
    Q2 = [[1, 2, 3]]
    K2 = [[4, 5, 6], [7, 8, 9]]
    result2 = attention_alignment(Q2, K2)
    assert result2 == [[32, 50]], f"Expected [[32, 50]], got {result2}"
    print("✓ Passed\n")
    
    print("Test 3: Identity matrices")
    Q3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    K3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    result3 = attention_alignment(Q3, K3)
    assert result3 == [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    print("✓ Passed\n")
    
    print("All tests passed! ✓")
