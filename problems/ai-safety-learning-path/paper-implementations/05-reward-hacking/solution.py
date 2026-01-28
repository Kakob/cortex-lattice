"""Reward Hacking Detection System"""
import numpy as np
from typing import List, Tuple
from collections import deque

class RewardHackingDetector:
    """Detect when agents exploit reward function weaknesses."""
    
    def __init__(self, window_size=1000, z_threshold=3.0):
        self.window_size = window_size
        self.z_threshold = z_threshold
        self.reward_history = deque(maxlen=window_size)
        self.behavior_history = deque(maxlen=window_size)
        
        # Running statistics
        self.mean = 0.0
        self.var = 1.0
        self.n = 0
    
    def update_stats(self, reward):
        """Welford online mean/variance."""
        self.n += 1
        delta = reward - self.mean
        self.mean += delta / self.n
        delta2 = reward - self.mean
        self.var += (delta * delta2 - self.var) / self.n
    
    def detect_anomaly(self, reward, behavior_features):
        """Check for reward hacking indicators."""
        self.reward_history.append(reward)
        self.behavior_history.append(behavior_features)
        self.update_stats(reward)
        
        alerts = []
        
        # 1. Sudden reward spike
        if self.n > 100:
            z_score = (reward - self.mean) / (np.sqrt(self.var) + 1e-8)
            if z_score > self.z_threshold:
                alerts.append(f"Reward spike: z={z_score:.2f}")
        
        # 2. Low behavior diversity
        if len(self.behavior_history) > 100:
            recent = list(self.behavior_history)[-100:]
            diversity = len(set(map(tuple, recent))) / 100
            if diversity < 0.1:
                alerts.append(f"Low diversity: {diversity:.2f}")
        
        # 3. Reward/complexity ratio
        if len(self.reward_history) > 100:
            recent_rewards = list(self.reward_history)[-100:]
            if np.mean(recent_rewards) > self.mean * 2:
                alerts.append("Reward much higher than baseline")
        
        return alerts

def monitor_training(agent, env, detector, episodes=1000):
    """Monitor training for reward hacking."""
    for ep in range(episodes):
        obs = env.reset()
        done = False
        ep_reward = 0
        behaviors = []
        
        while not done:
            action = agent.act(obs)
            behaviors.append(action)
            obs, reward, done, _ = env.step(action)
            ep_reward += reward
        
        alerts = detector.detect_anomaly(ep_reward, behaviors)
        if alerts:
            print(f"Episode {ep} alerts: {alerts}")
