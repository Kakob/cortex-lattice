from typing import List
import copy

def parallel_prefix_sum(values: List[float]) -> List[float]:
    """
    Parallel prefix sum using the Blelloch scan algorithm.
    
    Two phases:
    1. Up-sweep (reduce): Build tree of partial sums
    2. Down-sweep: Distribute to get all prefixes
    
    Time: O(n) total work, O(log n) parallel steps
    Space: O(n)
    
    This is how CUDA implements cumulative operations!
    """
    n = len(values)
    result = copy.copy(values)
    
    # Up-sweep (reduce) phase
    # Build tree of partial sums
    offset = 1
    while offset < n:
        # In parallel: for all i where (i+1) % (2*offset) == 0
        for i in range(2 * offset - 1, n, 2 * offset):
            result[i] += result[i - offset]
        offset *= 2
    
    # Set last element to 0 for exclusive scan
    # (We'll convert to inclusive at the end)
    last = result[-1]
    result[-1] = 0
    
    # Down-sweep phase
    # Distribute partial sums down the tree
    offset = n // 2
    while offset > 0:
        for i in range(2 * offset - 1, n, 2 * offset):
            left = i - offset
            temp = result[left]
            result[left] = result[i]
            result[i] += temp
        offset //= 2
    
    # Convert from exclusive to inclusive scan
    for i in range(n - 1):
        result[i] = result[i + 1]
    result[-1] = last
    
    return result


def simple_prefix_sum(values: List[float]) -> List[float]:
    """Sequential prefix sum for comparison. O(n) sequential steps."""
    result = []
    total = 0
    for v in values:
        total += v
        result.append(total)
    return result


def parallel_scan_general(values: List[float], op, identity) -> List[float]:
    """
    Generalized scan that works with any associative operation.
    
    op: associative binary operation
    identity: identity element for op
    """
    n = len(values)
    result = copy.copy(values)
    
    # Up-sweep
    offset = 1
    while offset < n:
        for i in range(2 * offset - 1, n, 2 * offset):
            result[i] = op(result[i - offset], result[i])
        offset *= 2
    
    last = result[-1]
    result[-1] = identity
    
    # Down-sweep
    offset = n // 2
    while offset > 0:
        for i in range(2 * offset - 1, n, 2 * offset):
            left = i - offset
            temp = result[left]
            result[left] = result[i]
            result[i] = op(result[i], temp)
        offset //= 2
    
    # Inclusive
    for i in range(n - 1):
        result[i] = result[i + 1]
    result[-1] = last
    
    return result


if __name__ == "__main__":
    values = [1, 2, 3, 4, 5, 6, 7, 8]
    
    print(f"Input: {values}")
    print(f"Sequential: {simple_prefix_sum(values)}")
    print(f"Parallel:   {parallel_prefix_sum(values)}")
    
    # Verify they match
    assert parallel_prefix_sum(values) == simple_prefix_sum(values)
    print("✓ Results match!")
