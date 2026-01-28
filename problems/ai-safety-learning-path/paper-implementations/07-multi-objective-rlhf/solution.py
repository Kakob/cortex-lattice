"""Multi-Objective RLHF Implementation"""
import torch
import numpy as np
from typing import List, Dict

class MultiObjectiveRewardModel:
    """Multiple reward models for different objectives."""
    
    def __init__(self, reward_models: Dict[str, torch.nn.Module]):
        self.reward_models = reward_models
        self.objectives = list(reward_models.keys())
    
    def get_rewards(self, response) -> Dict[str, float]:
        """Get reward for each objective."""
        rewards = {}
        for name, model in self.reward_models.items():
            rewards[name] = model(response).item()
        return rewards
    
    def scalarize(self, rewards: Dict[str, float], weights: Dict[str, float]) -> float:
        """Weighted sum scalarization."""
        return sum(weights[k] * rewards[k] for k in rewards)

class ParetoRLHF:
    """RLHF with Pareto-optimal objective balancing."""
    
    def __init__(self, policy, multi_rm, objectives=["helpful", "harmless"]):
        self.policy = policy
        self.multi_rm = multi_rm
        self.objectives = objectives
    
    def is_pareto_dominated(self, a: Dict, b: Dict) -> bool:
        """Check if solution a is dominated by b."""
        at_least_one_better = False
        for obj in self.objectives:
            if b[obj] < a[obj]:
                return False
            if b[obj] > a[obj]:
                at_least_one_better = True
        return at_least_one_better
    
    def find_pareto_frontier(self, solutions: List[Dict]) -> List[Dict]:
        """Find non-dominated solutions."""
        frontier = []
        for sol in solutions:
            dominated = False
            for other in solutions:
                if self.is_pareto_dominated(sol, other):
                    dominated = True
                    break
            if not dominated:
                frontier.append(sol)
        return frontier
    
    def adaptive_weights(self, history: List[Dict], target_ratios: Dict) -> Dict:
        """Adaptively adjust objective weights."""
        if not history:
            return {obj: 1.0 / len(self.objectives) for obj in self.objectives}
        
        # Compute current ratios
        avg_rewards = {obj: np.mean([h[obj] for h in history]) for obj in self.objectives}
        total = sum(avg_rewards.values())
        current_ratios = {obj: avg_rewards[obj] / total for obj in self.objectives}
        
        # Adjust weights to move toward target
        weights = {}
        for obj in self.objectives:
            error = target_ratios.get(obj, 0.5) - current_ratios[obj]
            weights[obj] = max(0.1, 1.0 + error * 2)
        
        # Normalize
        total_w = sum(weights.values())
        return {k: v / total_w for k, v in weights.items()}
