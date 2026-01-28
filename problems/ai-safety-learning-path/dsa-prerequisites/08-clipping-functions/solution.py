from typing import List

def ppo_clip_objective(
    ratios: List[float], 
    advantages: List[float], 
    epsilon: float
) -> List[float]:
    """
    PPO Clipped Objective.
    
    L_CLIP = min(r*A, clip(r, 1-ε, 1+ε)*A)
    
    The logic:
    - If A > 0 (good action): Don't let ratio go above 1+ε
    - If A < 0 (bad action): Don't let ratio go below 1-ε
    
    This prevents the policy from changing too much in one update.
    
    Time: O(n)
    Space: O(n)
    """
    objectives = []
    
    for ratio, advantage in zip(ratios, advantages):
        # Unclipped objective
        unclipped = ratio * advantage
        
        # Clipped ratio
        clipped_ratio = max(1 - epsilon, min(1 + epsilon, ratio))
        clipped = clipped_ratio * advantage
        
        # Take minimum (pessimistic bound)
        # This is the key insight of PPO!
        objective = min(unclipped, clipped)
        objectives.append(objective)
    
    return objectives


def ppo_loss(ratios: List[float], advantages: List[float], 
             epsilon: float = 0.2) -> float:
    """
    Full PPO loss (negative of mean clipped objective).
    We negate because we want to MAXIMIZE the objective.
    """
    objectives = ppo_clip_objective(ratios, advantages, epsilon)
    return -sum(objectives) / len(objectives)


def visualize_clipping(advantage: float, epsilon: float = 0.2):
    """Visualize the clipping effect."""
    print(f"\nPPO Clipping Visualization (A={advantage}, ε={epsilon})")
    print("=" * 50)
    
    ratios = [0.5, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 2.0]
    
    for r in ratios:
        unclipped = r * advantage
        clipped_r = max(1-epsilon, min(1+epsilon, r))
        clipped = clipped_r * advantage
        objective = min(unclipped, clipped)
        
        clip_note = ""
        if r < 1 - epsilon:
            clip_note = f" (ratio clipped from {r:.1f} to {1-epsilon})"
        elif r > 1 + epsilon:
            clip_note = f" (ratio clipped from {r:.1f} to {1+epsilon})"
        
        print(f"r={r:.1f}: unclip={unclipped:+.2f}, clip={clipped:+.2f}, "
              f"L_CLIP={objective:+.2f}{clip_note}")


if __name__ == "__main__":
    # Test
    ratios = [0.8, 1.0, 1.2, 1.5]
    advantages = [1.0, 1.0, 1.0, 1.0]
    epsilon = 0.2
    
    result = ppo_clip_objective(ratios, advantages, epsilon)
    print("PPO Clipped Objectives:", [round(r, 2) for r in result])
    
    visualize_clipping(advantage=1.0)
    visualize_clipping(advantage=-1.0)
