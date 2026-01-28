"""
RLHF (Reinforcement Learning from Human Feedback) Implementation

This implements the InstructGPT training pipeline:
1. Supervised Fine-Tuning (SFT)
2. Reward Model Training
3. PPO Fine-Tuning with KL Penalty

Author: AI Safety Learning Path
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class Comparison:
    """Human preference comparison."""
    prompt: str
    chosen: str
    rejected: str


class RewardModel(nn.Module):
    """
    Reward Model for RLHF.
    
    Architecture: Base LM + Linear head for scalar reward
    
    Training: Bradley-Terry model on human comparisons
    P(chosen > rejected) = σ(r_chosen - r_rejected)
    """
    
    def __init__(self, base_model: nn.Module, hidden_size: int):
        super().__init__()
        self.base_model = base_model
        self.reward_head = nn.Linear(hidden_size, 1)
    
    def forward(
        self, 
        input_ids: torch.Tensor, 
        attention_mask: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute reward for (prompt, response) sequence.
        
        Returns scalar reward per sequence.
        """
        # Get last hidden state from base model
        outputs = self.base_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True
        )
        
        # Use last token representation
        last_hidden = outputs.hidden_states[-1]
        
        # Find last non-padding position
        sequence_lengths = attention_mask.sum(dim=1) - 1
        batch_indices = torch.arange(input_ids.size(0), device=input_ids.device)
        last_token_hidden = last_hidden[batch_indices, sequence_lengths]
        
        # Scalar reward
        rewards = self.reward_head(last_token_hidden).squeeze(-1)
        
        return rewards
    
    def compute_loss(
        self, 
        chosen_ids: torch.Tensor,
        chosen_mask: torch.Tensor,
        rejected_ids: torch.Tensor,
        rejected_mask: torch.Tensor
    ) -> torch.Tensor:
        """
        Bradley-Terry loss for preference learning.
        
        Loss = -log(σ(r_chosen - r_rejected))
        """
        rewards_chosen = self.forward(chosen_ids, chosen_mask)
        rewards_rejected = self.forward(rejected_ids, rejected_mask)
        
        # Log sigmoid of reward difference
        loss = -F.logsigmoid(rewards_chosen - rewards_rejected).mean()
        
        return loss


class RLHFTrainer:
    """
    Full RLHF training pipeline combining:
    - Policy model (being trained)
    - Reference model (frozen SFT model)
    - Reward model (trained on comparisons)
    
    The key innovation: KL penalty prevents reward hacking
    
    reward_rlhf = reward_model(response) - β * KL(policy || reference)
    """
    
    def __init__(
        self,
        policy_model: nn.Module,
        ref_model: nn.Module,
        reward_model: RewardModel,
        tokenizer,
        kl_coef: float = 0.1,
        clip_reward: float = 10.0,
        lr: float = 1e-5,
        ppo_epochs: int = 4,
        clip_epsilon: float = 0.2
    ):
        self.policy = policy_model
        self.ref = ref_model
        self.reward_model = reward_model
        self.tokenizer = tokenizer
        
        self.kl_coef = kl_coef
        self.clip_reward = clip_reward
        self.ppo_epochs = ppo_epochs
        self.clip_epsilon = clip_epsilon
        
        # Freeze reference and reward models
        for param in self.ref.parameters():
            param.requires_grad = False
        for param in self.reward_model.parameters():
            param.requires_grad = False
        
        self.optimizer = torch.optim.AdamW(self.policy.parameters(), lr=lr)
    
    def compute_kl_divergence(
        self,
        policy_logprobs: torch.Tensor,
        ref_logprobs: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute KL divergence KL(policy || ref).
        
        For token-level: KL = Σ policy_prob * (log policy_prob - log ref_prob)
        
        Approximation: KL ≈ (policy_logprob - ref_logprob)
        """
        return policy_logprobs - ref_logprobs
    
    def compute_rewards(
        self,
        prompts: torch.Tensor,
        responses: torch.Tensor,
        attention_mask: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Compute rewards with KL penalty.
        
        Returns:
            rewards: Reward model output
            kl: KL divergence from reference
            total_rewards: rewards - kl_coef * kl
        """
        # Concatenate prompt and response
        full_sequences = torch.cat([prompts, responses], dim=1)
        
        # Get reward from reward model
        with torch.no_grad():
            rewards = self.reward_model(full_sequences, attention_mask)
            rewards = torch.clamp(rewards, -self.clip_reward, self.clip_reward)
        
        # Get logprobs from policy and reference
        policy_outputs = self.policy(full_sequences)
        ref_outputs = self.ref(full_sequences)
        
        # Token-level KL
        policy_logprobs = F.log_softmax(policy_outputs.logits, dim=-1)
        ref_logprobs = F.log_softmax(ref_outputs.logits, dim=-1)
        
        # Only compute KL on response tokens
        response_mask = attention_mask[:, prompts.size(1):]
        kl = self.compute_kl_divergence(policy_logprobs, ref_logprobs)
        kl = (kl * response_mask.unsqueeze(-1)).sum() / response_mask.sum()
        
        # Total reward with KL penalty
        total_rewards = rewards - self.kl_coef * kl
        
        return rewards, kl, total_rewards
    
    def ppo_step(
        self,
        prompts: torch.Tensor,
        responses: torch.Tensor,
        old_logprobs: torch.Tensor,
        advantages: torch.Tensor,
        returns: torch.Tensor
    ) -> Dict[str, float]:
        """
        Single PPO update step.
        
        Uses clipped objective to prevent large policy changes.
        """
        metrics = {"policy_loss": 0, "value_loss": 0, "kl": 0}
        
        for _ in range(self.ppo_epochs):
            # Forward pass
            full_sequence = torch.cat([prompts, responses], dim=1)
            outputs = self.policy(full_sequence)
            
            # Get log probs for response tokens
            logits = outputs.logits[:, prompts.size(1)-1:-1]  # Shift for next token prediction
            new_logprobs = F.log_softmax(logits, dim=-1)
            new_logprobs = torch.gather(
                new_logprobs, 
                dim=-1, 
                index=responses.unsqueeze(-1)
            ).squeeze(-1)
            
            # Sum log probs over response
            new_logprobs = new_logprobs.sum(dim=1)
            
            # PPO ratio
            ratio = torch.exp(new_logprobs - old_logprobs)
            
            # Clipped objective
            unclipped = ratio * advantages
            clipped = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * advantages
            policy_loss = -torch.min(unclipped, clipped).mean()
            
            # Value loss (if using value head)
            # value_loss = F.mse_loss(values, returns)
            
            # Update
            self.optimizer.zero_grad()
            policy_loss.backward()
            torch.nn.utils.clip_grad_norm_(self.policy.parameters(), 1.0)
            self.optimizer.step()
            
            metrics["policy_loss"] += policy_loss.item()
            metrics["kl"] += (new_logprobs - old_logprobs).mean().item()
        
        for k in metrics:
            metrics[k] /= self.ppo_epochs
        
        return metrics
    
    def train_step(
        self,
        prompts: List[str],
        batch_size: int = 4
    ) -> Dict[str, float]:
        """
        Full RLHF training step:
        1. Generate responses from policy
        2. Compute rewards
        3. Compute advantages
        4. PPO update
        """
        self.policy.train()
        
        # Tokenize prompts
        prompt_tokens = self.tokenizer(
            prompts, 
            return_tensors="pt", 
            padding=True
        )
        
        # Generate responses
        with torch.no_grad():
            response_tokens = self.policy.generate(
                prompt_tokens.input_ids,
                max_new_tokens=128,
                do_sample=True,
                temperature=0.7
            )
        
        # Separate prompt and response
        responses = response_tokens[:, prompt_tokens.input_ids.size(1):]
        
        # Compute rewards
        rewards, kl, total_rewards = self.compute_rewards(
            prompt_tokens.input_ids,
            responses,
            response_tokens.attention_mask if hasattr(response_tokens, 'attention_mask') 
            else torch.ones_like(response_tokens)
        )
        
        # Get old log probs for PPO
        with torch.no_grad():
            old_outputs = self.policy(response_tokens)
            old_logprobs = F.log_softmax(old_outputs.logits, dim=-1)
            old_logprobs = torch.gather(
                old_logprobs[:, :-1],
                dim=-1,
                index=responses.unsqueeze(-1)
            ).squeeze(-1).sum(dim=1)
        
        # Compute advantages (simple: normalized rewards)
        advantages = (total_rewards - total_rewards.mean()) / (total_rewards.std() + 1e-8)
        
        # PPO update
        metrics = self.ppo_step(
            prompt_tokens.input_ids,
            responses,
            old_logprobs,
            advantages,
            total_rewards
        )
        
        metrics["reward"] = rewards.mean().item()
        metrics["kl_penalty"] = kl.item()
        
        return metrics


def train_reward_model(
    model: RewardModel,
    comparisons: List[Comparison],
    tokenizer,
    epochs: int = 3,
    lr: float = 1e-5
) -> RewardModel:
    """
    Train reward model on human comparisons.
    """
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    
    model.train()
    for epoch in range(epochs):
        total_loss = 0
        correct = 0
        
        for comp in comparisons:
            # Tokenize
            chosen = tokenizer(comp.prompt + comp.chosen, return_tensors="pt")
            rejected = tokenizer(comp.prompt + comp.rejected, return_tensors="pt")
            
            # Compute loss
            loss = model.compute_loss(
                chosen.input_ids,
                chosen.attention_mask,
                rejected.input_ids,
                rejected.attention_mask
            )
            
            # Update
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
            # Track accuracy
            with torch.no_grad():
                r_chosen = model(chosen.input_ids, chosen.attention_mask)
                r_rejected = model(rejected.input_ids, rejected.attention_mask)
                if r_chosen > r_rejected:
                    correct += 1
        
        accuracy = correct / len(comparisons)
        avg_loss = total_loss / len(comparisons)
        print(f"Epoch {epoch+1}, Loss: {avg_loss:.4f}, Accuracy: {accuracy:.2%}")
    
    return model


if __name__ == "__main__":
    print("RLHF Implementation")
    print("=" * 40)
    print("Components:")
    print("1. RewardModel - Predicts human preferences")
    print("2. RLHFTrainer - PPO with KL penalty")
    print("3. train_reward_model - Bradley-Terry training")
    print("\nSee solution.py for full implementation details.")
