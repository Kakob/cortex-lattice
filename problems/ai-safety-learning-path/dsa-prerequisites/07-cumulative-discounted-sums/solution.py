from typing import List

def discount_cumsum(rewards: List[float], gamma: float) -> List[float]:
    """
    Compute discounted cumulative sums (returns).
    
    G_t = r_t + γ*r_{t+1} + γ²*r_{t+2} + ...
        = r_t + γ*G_{t+1}
    
    Key insight: Work BACKWARDS! G_t depends on G_{t+1}.
    
    Time: O(n)
    Space: O(n)
    
    This is used in:
    - Computing returns for policy gradient
    - GAE (Generalized Advantage Estimation)
    - TD(λ) returns
    """
    n = len(rewards)
    returns = [0.0] * n
    
    # Start from the end
    returns[-1] = rewards[-1]
    
    # Work backwards
    for t in range(n - 2, -1, -1):
        returns[t] = rewards[t] + gamma * returns[t + 1]
    
    return returns


def gae(rewards: List[float], values: List[float], 
        gamma: float = 0.99, lam: float = 0.95) -> List[float]:
    """
    Generalized Advantage Estimation (GAE) - used in PPO.
    
    Balances bias vs variance in advantage estimation.
    
    δ_t = r_t + γ*V(s_{t+1}) - V(s_t)  (TD error)
    A_t = δ_t + (γλ)*δ_{t+1} + (γλ)²*δ_{t+2} + ...
    
    λ=0: A_t = δ_t (high bias, low variance)
    λ=1: A_t = G_t - V(s_t) (low bias, high variance)
    """
    n = len(rewards)
    advantages = [0.0] * n
    
    # Compute TD errors
    deltas = [0.0] * n
    for t in range(n - 1):
        deltas[t] = rewards[t] + gamma * values[t + 1] - values[t]
    deltas[-1] = rewards[-1] - values[-1]  # Terminal state
    
    # Discounted sum of TD errors
    advantages[-1] = deltas[-1]
    for t in range(n - 2, -1, -1):
        advantages[t] = deltas[t] + gamma * lam * advantages[t + 1]
    
    return advantages


if __name__ == "__main__":
    rewards = [1, 2, 3, 4]
    gamma = 0.99
    
    returns = discount_cumsum(rewards, gamma)
    print("Returns:", [round(r, 4) for r in returns])
    
    # Verify manually
    print("\nManual verification:")
    print(f"G_3 = {rewards[3]} = {rewards[3]}")
    print(f"G_2 = {rewards[2]} + {gamma}*{returns[3]} = {rewards[2] + gamma*returns[3]:.4f}")
    print(f"G_1 = {rewards[1]} + {gamma}*{returns[2]} = {rewards[1] + gamma*returns[2]:.4f}")
    print(f"G_0 = {rewards[0]} + {gamma}*{returns[1]} = {rewards[0] + gamma*returns[1]:.4f}")
