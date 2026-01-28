from typing import List
import math

def kl_divergence(P: List[float], Q: List[float]) -> float:
    """
    KL Divergence: KL(P || Q) = Σ P(x) * log(P(x) / Q(x))
    
    Intuition: Expected log-likelihood ratio under P.
    "How many extra bits do I need to encode samples from P using Q?"
    
    Properties:
    - KL >= 0 (always non-negative)
    - KL(P || P) = 0 (zero for identical distributions)
    - NOT symmetric: KL(P || Q) ≠ KL(Q || P)
    
    Time: O(n)
    Space: O(1)
    """
    kl = 0.0
    eps = 1e-10  # Numerical stability
    
    for p, q in zip(P, Q):
        if p > 0:  # 0 * log(0/q) = 0 by convention
            # Add small epsilon to prevent log(0)
            kl += p * math.log((p + eps) / (q + eps))
    
    return kl


def kl_divergence_from_logits(log_p: List[float], log_q: List[float]) -> float:
    """
    KL divergence from log probabilities (more numerically stable).
    
    KL(P || Q) = Σ P(x) * (log P(x) - log Q(x))
              = Σ exp(log_p) * (log_p - log_q)
    """
    kl = 0.0
    for lp, lq in zip(log_p, log_q):
        p = math.exp(lp)
        kl += p * (lp - lq)
    return kl


def js_divergence(P: List[float], Q: List[float]) -> float:
    """
    Jensen-Shannon divergence: symmetric version of KL.
    
    JS(P || Q) = 0.5 * KL(P || M) + 0.5 * KL(Q || M)
    where M = 0.5 * (P + Q)
    """
    M = [(p + q) / 2 for p, q in zip(P, Q)]
    return 0.5 * kl_divergence(P, M) + 0.5 * kl_divergence(Q, M)


if __name__ == "__main__":
    # Test cases
    print("KL Divergence Examples")
    print("=" * 40)
    
    # Identical distributions
    P1 = [0.5, 0.5]
    Q1 = [0.5, 0.5]
    print(f"KL([0.5, 0.5] || [0.5, 0.5]) = {kl_divergence(P1, Q1):.4f}")
    
    # Different distributions
    P2 = [0.9, 0.1]
    Q2 = [0.5, 0.5]
    print(f"KL([0.9, 0.1] || [0.5, 0.5]) = {kl_divergence(P2, Q2):.4f}")
    print(f"KL([0.5, 0.5] || [0.9, 0.1]) = {kl_divergence(Q2, P2):.4f}")
    print("Note: KL is NOT symmetric!")
    
    # JS divergence (symmetric)
    print(f"JS([0.9, 0.1] || [0.5, 0.5]) = {js_divergence(P2, Q2):.4f}")
