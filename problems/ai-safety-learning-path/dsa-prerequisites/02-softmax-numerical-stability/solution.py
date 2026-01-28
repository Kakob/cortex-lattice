from typing import List
import math

def stable_softmax(logits: List[float]) -> List[float]:
    """
    Compute softmax with numerical stability using the max subtraction trick.
    
    The key insight: softmax(x) = softmax(x - c) for any constant c.
    By choosing c = max(x), we ensure exp() never overflows.
    
    Mathematical proof:
    softmax(x - c)_i = exp(x_i - c) / sum(exp(x_j - c))
                     = exp(x_i)/exp(c) / sum(exp(x_j)/exp(c))
                     = exp(x_i)/exp(c) / (sum(exp(x_j))/exp(c))
                     = exp(x_i) / sum(exp(x_j))
                     = softmax(x)_i
    
    Time Complexity: O(n)
    Space Complexity: O(n)
    
    Args:
        logits: Raw scores (can be any real numbers)
    
    Returns:
        Probability distribution summing to 1.0
    """
    if not logits:
        return []
    
    # Step 1: Find maximum for numerical stability
    # This prevents exp() from overflowing
    max_logit = max(logits)
    
    # Step 2: Subtract max and compute exponentials
    # All exponents are now <= 0, so exp() values are in [0, 1]
    exp_shifted = [math.exp(x - max_logit) for x in logits]
    
    # Step 3: Compute sum for normalization
    exp_sum = sum(exp_shifted)
    
    # Step 4: Normalize to get probabilities
    probabilities = [e / exp_sum for e in exp_shifted]
    
    return probabilities


def naive_softmax(logits: List[float]) -> List[float]:
    """
    UNSTABLE version - DO NOT USE IN PRODUCTION!
    Included to demonstrate the overflow problem.
    """
    exp_values = [math.exp(x) for x in logits]  # Can overflow!
    exp_sum = sum(exp_values)
    return [e / exp_sum for e in exp_values]


def log_softmax(logits: List[float]) -> List[float]:
    """
    Log-softmax: Even more stable for loss computation.
    Used in cross-entropy loss to avoid log(0).
    
    log_softmax(x)_i = x_i - log(sum(exp(x_j)))
                     = x_i - max(x) - log(sum(exp(x_j - max(x))))
    """
    if not logits:
        return []
    
    max_logit = max(logits)
    shifted = [x - max_logit for x in logits]
    log_sum_exp = math.log(sum(math.exp(x) for x in shifted))
    
    return [x - log_sum_exp for x in shifted]


def softmax_with_temperature(logits: List[float], temperature: float = 1.0) -> List[float]:
    """
    Temperature-scaled softmax for controlling output sharpness.
    
    - temperature < 1: Sharper (more confident)
    - temperature > 1: Softer (more uniform)
    - temperature = 1: Standard softmax
    
    Used in: LLM sampling, knowledge distillation
    """
    if temperature <= 0:
        raise ValueError("Temperature must be positive")
    
    scaled = [x / temperature for x in logits]
    return stable_softmax(scaled)


def visualize_softmax_stability():
    """
    Demonstrates why numerical stability matters.
    """
    print("=" * 60)
    print("SOFTMAX NUMERICAL STABILITY DEMONSTRATION")
    print("=" * 60)
    
    # Test 1: Normal values
    print("\n1. Normal values [1, 2, 3]:")
    normal = [1.0, 2.0, 3.0]
    result = stable_softmax(normal)
    print(f"   Input: {normal}")
    print(f"   Stable softmax: {[f'{x:.4f}' for x in result]}")
    print(f"   Sum: {sum(result):.6f}")
    
    # Test 2: Large values (would overflow with naive)
    print("\n2. Large values [1000, 1001, 1002]:")
    large = [1000.0, 1001.0, 1002.0]
    print(f"   Input: {large}")
    print(f"   max subtraction: {[x - max(large) for x in large]}")
    result = stable_softmax(large)
    print(f"   Stable softmax: {[f'{x:.4f}' for x in result]}")
    print(f"   Sum: {sum(result):.6f}")
    print("   Note: SAME result as [1,2,3]! Shifting doesn't change softmax.")
    
    # Test 3: Demonstrate overflow with naive
    print("\n3. Naive softmax on large values (OVERFLOW!):")
    try:
        naive_result = naive_softmax(large)
        print(f"   Naive result: {naive_result}")
    except OverflowError:
        print("   OverflowError: math range error")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Very negative values
    print("\n4. Very negative values [-1000, -999, -998]:")
    negative = [-1000.0, -999.0, -998.0]
    print(f"   Input: {negative}")
    print(f"   After max subtraction: {[x - max(negative) for x in negative]}")
    result = stable_softmax(negative)
    print(f"   Stable softmax: {[f'{x:.4f}' for x in result]}")
    print("   Note: Still SAME result! Softmax is translation-invariant.")
    
    # Test 5: Temperature scaling
    print("\n5. Temperature scaling on [0, 1, 2]:")
    logits = [0.0, 1.0, 2.0]
    for temp in [0.5, 1.0, 2.0]:
        result = softmax_with_temperature(logits, temp)
        print(f"   T={temp}: {[f'{x:.4f}' for x in result]}")
    print("   Lower T = sharper (more confident), Higher T = softer")


if __name__ == "__main__":
    visualize_softmax_stability()
    
    # Verify test cases
    print("\n" + "=" * 60)
    print("RUNNING TEST CASES")
    print("=" * 60)
    
    def approx_equal(a, b, tol=0.001):
        return all(abs(x - y) < tol for x, y in zip(a, b))
    
    tests = [
        ([1.0, 2.0, 3.0], [0.0900, 0.2447, 0.6652]),
        ([1000.0, 1001.0, 1002.0], [0.0900, 0.2447, 0.6652]),
        ([0.0, 0.0, 0.0], [0.3333, 0.3333, 0.3333]),
        ([100.0], [1.0]),
    ]
    
    for logits, expected in tests:
        result = stable_softmax(logits)
        passed = approx_equal(result, expected)
        status = "✓" if passed else "✗"
        print(f"{status} Input: {logits}")
        print(f"  Expected: {expected}")
        print(f"  Got:      {[round(x, 4) for x in result]}")
    
    print("\nAll tests completed!")
