"""Adversarial Prompt Detection System"""
import numpy as np
from typing import List, Tuple
import re

# Known attack patterns (simplified)
ATTACK_PATTERNS = [
    r"ignore (previous|all|your) instructions",
    r"you are now",
    r"pretend (to be|you are)",
    r"do anything now",
    r"jailbreak",
    r"bypass (safety|content|filter)",
]

class AdversarialPromptDetector:
    """Detect adversarial prompts and jailbreak attempts."""
    
    def __init__(self, embedding_model=None, threshold=0.7):
        self.embedding_model = embedding_model
        self.threshold = threshold
        self.attack_embeddings = []
        self.patterns = [re.compile(p, re.IGNORECASE) for p in ATTACK_PATTERNS]
    
    def add_known_attack(self, attack_text: str):
        """Add known attack to detection database."""
        if self.embedding_model:
            emb = self.embedding_model.encode(attack_text)
            self.attack_embeddings.append(emb)
    
    def detect(self, prompt: str) -> Tuple[bool, float, str]:
        """
        Detect if prompt is adversarial.
        Returns (is_adversarial, confidence, reason)
        """
        # Check pattern matching
        for pattern in self.patterns:
            if pattern.search(prompt):
                return True, 0.95, f"Pattern match: {pattern.pattern}"
        
        # Check embedding similarity
        if self.embedding_model and self.attack_embeddings:
            prompt_emb = self.embedding_model.encode(prompt)
            for attack_emb in self.attack_embeddings:
                sim = self._cosine_similarity(prompt_emb, attack_emb)
                if sim > self.threshold:
                    return True, sim, "Embedding similarity"
        
        # Check for suspicious characteristics
        suspicion_score = self._compute_suspicion(prompt)
        if suspicion_score > 0.8:
            return True, suspicion_score, "Suspicious characteristics"
        
        return False, 0.0, "Clean"
    
    def _cosine_similarity(self, a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)
    
    def _compute_suspicion(self, prompt: str) -> float:
        score = 0.0
        
        # Excessive special characters
        special_ratio = sum(1 for c in prompt if not c.isalnum()) / (len(prompt) + 1)
        if special_ratio > 0.3:
            score += 0.3
        
        # Very long prompt
        if len(prompt) > 2000:
            score += 0.2
        
        # Role-play indicators
        if any(x in prompt.lower() for x in ["you are", "act as", "roleplay"]):
            score += 0.3
        
        return min(score, 1.0)

def evaluate_detector(detector, test_prompts, labels):
    """Evaluate detector performance."""
    tp = fp = tn = fn = 0
    
    for prompt, label in zip(test_prompts, labels):
        is_adv, conf, reason = detector.detect(prompt)
        
        if label == 1 and is_adv:
            tp += 1
        elif label == 0 and is_adv:
            fp += 1
        elif label == 0 and not is_adv:
            tn += 1
        else:
            fn += 1
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    
    return {"precision": precision, "recall": recall, "f1": f1}
