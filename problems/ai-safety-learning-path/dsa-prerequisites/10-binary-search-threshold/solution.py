from typing import List

def find_optimal_threshold(scores: List[float], labels: List[int]) -> float:
    """
    Find the optimal classification threshold.
    
    We can use binary search because F1 score is often unimodal
    with respect to threshold (increases then decreases).
    
    Actually, the optimal threshold is often at one of the score values,
    so we can just try all unique score values as thresholds.
    
    Time: O(n) for linear scan, O(n log n) for binary search approach
    Space: O(1)
    """
    best_f1 = 0.0
    best_threshold = 0.0
    
    # Try each score as a potential threshold
    thresholds = [0.0] + scores + [1.0]
    
    for threshold in thresholds:
        # Compute predictions at this threshold
        tp = sum(1 for s, l in zip(scores, labels) if s >= threshold and l == 1)
        fp = sum(1 for s, l in zip(scores, labels) if s >= threshold and l == 0)
        fn = sum(1 for s, l in zip(scores, labels) if s < threshold and l == 1)
        
        # Compute F1
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = threshold
    
    return best_threshold


def binary_search_threshold(scores: List[float], labels: List[int]) -> float:
    """
    Binary search approach (works if F1 is unimodal).
    """
    left, right = 0.0, 1.0
    
    def compute_f1(threshold):
        tp = sum(1 for s, l in zip(scores, labels) if s >= threshold and l == 1)
        fp = sum(1 for s, l in zip(scores, labels) if s >= threshold and l == 0)
        fn = sum(1 for s, l in zip(scores, labels) if s < threshold and l == 1)
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        return 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    
    for _ in range(100):  # Sufficient iterations
        mid1 = left + (right - left) / 3
        mid2 = right - (right - left) / 3
        
        f1_mid1 = compute_f1(mid1)
        f1_mid2 = compute_f1(mid2)
        
        if f1_mid1 < f1_mid2:
            left = mid1
        else:
            right = mid2
    
    return (left + right) / 2


if __name__ == "__main__":
    scores = [0.1, 0.3, 0.5, 0.7, 0.9]
    labels = [0, 0, 1, 1, 1]
    
    threshold = find_optimal_threshold(scores, labels)
    print(f"Optimal threshold: {threshold}")
