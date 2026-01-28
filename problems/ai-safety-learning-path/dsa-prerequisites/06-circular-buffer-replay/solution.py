from typing import List, Tuple, Any, Optional
import random
from collections import deque
import numpy as np

class ReplayBuffer:
    """
    Circular buffer for experience replay in RL.
    
    Key design choices:
    - Fixed capacity with FIFO eviction
    - O(1) push (amortized)
    - O(batch_size) random sampling
    
    Used in: DQN, DDPG, SAC, and any off-policy RL algorithm.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.buffer = []
        self.position = 0  # Next write position
    
    def push(self, state, action, reward, next_state, done):
        """Add experience to buffer. O(1) amortized."""
        experience = (state, action, reward, next_state, done)
        
        if len(self.buffer) < self.capacity:
            # Buffer not full yet
            self.buffer.append(experience)
        else:
            # Overwrite oldest (circular)
            self.buffer[self.position] = experience
        
        # Move position forward (wrap around)
        self.position = (self.position + 1) % self.capacity
    
    def sample(self, batch_size: int) -> List[Tuple]:
        """Sample random batch. O(batch_size)."""
        return random.sample(self.buffer, min(batch_size, len(self.buffer)))
    
    def __len__(self) -> int:
        return len(self.buffer)


class PrioritizedReplayBuffer:
    """
    Advanced: Prioritized Experience Replay.
    
    Samples experiences with higher TD-error more frequently.
    Used in Rainbow DQN and other advanced algorithms.
    """
    
    def __init__(self, capacity: int, alpha: float = 0.6):
        self.capacity = capacity
        self.alpha = alpha  # Prioritization exponent
        self.buffer = []
        self.priorities = []
        self.position = 0
    
    def push(self, state, action, reward, next_state, done, priority=1.0):
        experience = (state, action, reward, next_state, done)
        
        if len(self.buffer) < self.capacity:
            self.buffer.append(experience)
            self.priorities.append(priority ** self.alpha)
        else:
            self.buffer[self.position] = experience
            self.priorities[self.position] = priority ** self.alpha
        
        self.position = (self.position + 1) % self.capacity
    
    def sample(self, batch_size: int, beta: float = 0.4):
        """Sample with importance sampling weights."""
        total_priority = sum(self.priorities)
        probs = [p / total_priority for p in self.priorities]
        
        indices = random.choices(range(len(self.buffer)), weights=probs, k=batch_size)
        
        # Importance sampling weights
        n = len(self.buffer)
        weights = [(n * probs[i]) ** (-beta) for i in indices]
        max_weight = max(weights)
        weights = [w / max_weight for w in weights]  # Normalize
        
        experiences = [self.buffer[i] for i in indices]
        return experiences, indices, weights
    
    def update_priorities(self, indices: List[int], priorities: List[float]):
        """Update priorities after learning."""
        for idx, priority in zip(indices, priorities):
            self.priorities[idx] = priority ** self.alpha


if __name__ == "__main__":
    # Test basic buffer
    buffer = ReplayBuffer(capacity=3)
    
    print("Pushing 4 experiences into buffer of size 3:")
    for i in range(4):
        buffer.push([i], i % 2, i, [i+1], False)
        print(f"  After push {i}: len={len(buffer)}")
    
    print(f"\nSampling 2 experiences:")
    batch = buffer.sample(2)
    for exp in batch:
        print(f"  {exp}")
