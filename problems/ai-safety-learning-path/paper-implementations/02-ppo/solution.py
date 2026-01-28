"""
PPO (Proximal Policy Optimization) from Scratch

This implements PPO with:
- Actor-Critic architecture
- Generalized Advantage Estimation (GAE)
- Clipped surrogate objective
- Value function clipping
- Entropy bonus for exploration

Author: AI Safety Learning Path
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import gymnasium as gym
from typing import List, Tuple, Dict
from dataclasses import dataclass


@dataclass
class Transition:
    """Single transition in trajectory."""
    state: np.ndarray
    action: int
    reward: float
    done: bool
    log_prob: float
    value: float


class Actor(nn.Module):
    """
    Policy network for discrete actions.
    
    Outputs a categorical distribution over actions.
    """
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, action_dim)
        )
    
    def forward(self, state: torch.Tensor) -> torch.distributions.Categorical:
        logits = self.net(state)
        return torch.distributions.Categorical(logits=logits)


class Critic(nn.Module):
    """
    Value network.
    
    Estimates V(s) - expected return from state s.
    """
    
    def __init__(self, state_dim: int, hidden_dim: int = 64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1)
        )
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        return self.net(state).squeeze(-1)


class PPO:
    """
    Proximal Policy Optimization agent.
    
    Key hyperparameters:
    - gamma: Discount factor for future rewards
    - gae_lambda: GAE parameter (0 = high bias, 1 = high variance)
    - clip_epsilon: Clipping range for policy ratio
    - epochs: Number of update epochs per batch of experience
    """
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 3e-4,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_epsilon: float = 0.2,
        value_coef: float = 0.5,
        entropy_coef: float = 0.01,
        epochs: int = 10,
        batch_size: int = 64
    ):
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef
        self.epochs = epochs
        self.batch_size = batch_size
        
        # Networks
        self.actor = Actor(state_dim, action_dim)
        self.critic = Critic(state_dim)
        
        # Optimizers
        self.actor_optimizer = torch.optim.Adam(self.actor.parameters(), lr=lr)
        self.critic_optimizer = torch.optim.Adam(self.critic.parameters(), lr=lr)
    
    def select_action(self, state: np.ndarray) -> Tuple[int, float, float]:
        """
        Select action using current policy.
        
        Returns: (action, log_prob, value)
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            dist = self.actor(state_tensor)
            value = self.critic(state_tensor)
        
        action = dist.sample()
        log_prob = dist.log_prob(action)
        
        return action.item(), log_prob.item(), value.item()
    
    def compute_gae(
        self,
        rewards: List[float],
        values: List[float],
        dones: List[bool],
        last_value: float
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Compute Generalized Advantage Estimation.
        
        GAE balances bias and variance in advantage estimation:
        - λ = 0: A_t = δ_t (high bias, low variance)
        - λ = 1: A_t = G_t - V(s_t) (low bias, high variance)
        
        δ_t = r_t + γ*V(s_{t+1}) - V(s_t)  (TD error)
        A_t = δ_t + (γλ)*δ_{t+1} + (γλ)²*δ_{t+2} + ...
        """
        advantages = []
        returns = []
        
        gae = 0
        next_value = last_value
        
        # Process in reverse
        for t in reversed(range(len(rewards))):
            if dones[t]:
                next_value = 0
                gae = 0
            
            # TD error
            delta = rewards[t] + self.gamma * next_value - values[t]
            
            # GAE
            gae = delta + self.gamma * self.gae_lambda * gae
            
            advantages.insert(0, gae)
            returns.insert(0, gae + values[t])
            
            next_value = values[t]
        
        advantages = torch.FloatTensor(advantages)
        returns = torch.FloatTensor(returns)
        
        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        return advantages, returns
    
    def update(self, trajectories: List[Transition]) -> Dict[str, float]:
        """
        Update policy using PPO clipped objective.
        
        L_CLIP = min(r(θ)*A, clip(r(θ), 1-ε, 1+ε)*A)
        
        where r(θ) = π_new(a|s) / π_old(a|s)
        """
        # Extract data from trajectories
        states = torch.FloatTensor([t.state for t in trajectories])
        actions = torch.LongTensor([t.action for t in trajectories])
        old_log_probs = torch.FloatTensor([t.log_prob for t in trajectories])
        rewards = [t.reward for t in trajectories]
        dones = [t.done for t in trajectories]
        values = [t.value for t in trajectories]
        
        # Get last value for GAE computation
        with torch.no_grad():
            last_state = torch.FloatTensor(trajectories[-1].state).unsqueeze(0)
            last_value = self.critic(last_state).item() if not trajectories[-1].done else 0
        
        # Compute advantages and returns
        advantages, returns = self.compute_gae(rewards, values, dones, last_value)
        
        # Multiple epochs of updates
        n_samples = len(trajectories)
        metrics = {"policy_loss": 0, "value_loss": 0, "entropy": 0}
        
        for _ in range(self.epochs):
            # Shuffle indices
            indices = torch.randperm(n_samples)
            
            for start in range(0, n_samples, self.batch_size):
                end = min(start + self.batch_size, n_samples)
                batch_indices = indices[start:end]
                
                # Get batch
                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_advantages = advantages[batch_indices]
                batch_returns = returns[batch_indices]
                
                # Get current policy distribution and values
                dist = self.actor(batch_states)
                current_values = self.critic(batch_states)
                
                # Log probs and entropy
                current_log_probs = dist.log_prob(batch_actions)
                entropy = dist.entropy().mean()
                
                # Policy ratio
                ratio = torch.exp(current_log_probs - batch_old_log_probs)
                
                # Clipped objective
                unclipped = ratio * batch_advantages
                clipped = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * batch_advantages
                policy_loss = -torch.min(unclipped, clipped).mean()
                
                # Value loss (MSE)
                value_loss = F.mse_loss(current_values, batch_returns)
                
                # Total loss
                loss = policy_loss + self.value_coef * value_loss - self.entropy_coef * entropy
                
                # Update
                self.actor_optimizer.zero_grad()
                self.critic_optimizer.zero_grad()
                loss.backward()
                
                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(self.actor.parameters(), 0.5)
                torch.nn.utils.clip_grad_norm_(self.critic.parameters(), 0.5)
                
                self.actor_optimizer.step()
                self.critic_optimizer.step()
                
                metrics["policy_loss"] += policy_loss.item()
                metrics["value_loss"] += value_loss.item()
                metrics["entropy"] += entropy.item()
        
        # Average metrics
        n_updates = self.epochs * (n_samples // self.batch_size + 1)
        for k in metrics:
            metrics[k] /= n_updates
        
        return metrics


def train_ppo(
    env_name: str = "CartPole-v1",
    total_timesteps: int = 50000,
    trajectory_length: int = 2048
):
    """
    Train PPO on a Gym environment.
    """
    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n
    
    agent = PPO(state_dim, action_dim)
    
    state, _ = env.reset()
    episode_reward = 0
    episode_rewards = []
    trajectories = []
    
    for step in range(total_timesteps):
        # Select action
        action, log_prob, value = agent.select_action(state)
        
        # Environment step
        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated
        
        # Store transition
        trajectories.append(Transition(state, action, reward, done, log_prob, value))
        
        episode_reward += reward
        state = next_state
        
        if done:
            episode_rewards.append(episode_reward)
            state, _ = env.reset()
            episode_reward = 0
        
        # Update policy when we have enough experience
        if len(trajectories) >= trajectory_length:
            metrics = agent.update(trajectories)
            trajectories = []
            
            if len(episode_rewards) > 0:
                avg_reward = np.mean(episode_rewards[-10:])
                print(f"Step {step}, Avg Reward: {avg_reward:.1f}, "
                      f"Policy Loss: {metrics['policy_loss']:.4f}")
                
                if avg_reward >= 500:
                    print("\n🎉 Solved!")
                    break
    
    env.close()
    return agent


if __name__ == "__main__":
    print("Training PPO on CartPole...")
    agent = train_ppo()
