from typing import List
import math

def cosine_similarity(A: List[float], B: List[float]) -> float:
    """
    Cosine similarity: cos(θ) = (A · B) / (||A|| × ||B||)
    
    Measures angle between vectors, not magnitude.
    Perfect for comparing embeddings of different lengths!
    
    Time: O(n)
    Space: O(1)
    """
    dot_product = sum(a * b for a, b in zip(A, B))
    norm_A = math.sqrt(sum(a * a for a in A))
    norm_B = math.sqrt(sum(b * b for b in B))
    
    if norm_A == 0 or norm_B == 0:
        return 0.0  # Undefined for zero vectors
    
    return dot_product / (norm_A * norm_B)


def batch_cosine_similarity(query: List[float], 
                           embeddings: List[List[float]]) -> List[float]:
    """
    Compute cosine similarity of query against all embeddings.
    
    Optimization: Precompute query norm once.
    """
    query_norm = math.sqrt(sum(q * q for q in query))
    
    similarities = []
    for emb in embeddings:
        dot = sum(q * e for q, e in zip(query, emb))
        emb_norm = math.sqrt(sum(e * e for e in emb))
        
        if query_norm == 0 or emb_norm == 0:
            similarities.append(0.0)
        else:
            similarities.append(dot / (query_norm * emb_norm))
    
    return similarities


def find_most_similar(query: List[float], 
                      embeddings: List[List[float]], 
                      k: int = 5) -> List[tuple]:
    """
    Find k most similar embeddings to query.
    Returns list of (index, similarity) tuples.
    """
    similarities = batch_cosine_similarity(query, embeddings)
    indexed = [(i, sim) for i, sim in enumerate(similarities)]
    indexed.sort(key=lambda x: x[1], reverse=True)
    return indexed[:k]


if __name__ == "__main__":
    # Test cases
    print("Cosine Similarity Tests")
    print("=" * 40)
    
    # Identical
    A1 = [1, 0, 0]
    B1 = [1, 0, 0]
    print(f"Identical: {cosine_similarity(A1, B1):.4f}")  # 1.0
    
    # Orthogonal
    A2 = [1, 0]
    B2 = [0, 1]
    print(f"Orthogonal: {cosine_similarity(A2, B2):.4f}")  # 0.0
    
    # Opposite
    A3 = [1, 0]
    B3 = [-1, 0]
    print(f"Opposite: {cosine_similarity(A3, B3):.4f}")  # -1.0
    
    # Different magnitudes but same direction
    A4 = [1, 2, 3]
    B4 = [2, 4, 6]
    print(f"Same direction, diff mag: {cosine_similarity(A4, B4):.4f}")  # 1.0
