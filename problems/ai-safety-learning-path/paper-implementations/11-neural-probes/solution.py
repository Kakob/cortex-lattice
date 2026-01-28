"""Neural Network Probing Classifiers"""
import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Tuple

class LinearProbe(nn.Module):
    """Linear classifier for probing representations."""
    
    def __init__(self, hidden_size: int, num_classes: int):
        super().__init__()
        self.linear = nn.Linear(hidden_size, num_classes)
    
    def forward(self, x):
        return self.linear(x)

class ProbingClassifier:
    """Probe neural network representations for concepts."""
    
    def __init__(self, model, tokenizer, layer_index: int = -1):
        self.model = model
        self.tokenizer = tokenizer
        self.layer_index = layer_index
        self.probes: Dict[str, LinearProbe] = {}
    
    def extract_representations(self, texts: List[str]) -> torch.Tensor:
        """Extract hidden representations from model."""
        representations = []
        
        for text in texts:
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True)
            
            with torch.no_grad():
                outputs = self.model(**inputs, output_hidden_states=True)
            
            # Get representation from specified layer
            hidden = outputs.hidden_states[self.layer_index]
            # Use mean pooling
            rep = hidden.mean(dim=1).squeeze()
            representations.append(rep)
        
        return torch.stack(representations)
    
    def train_probe(self, concept: str, texts: List[str], 
                   labels: List[int], epochs: int = 100) -> float:
        """Train a probe for a concept."""
        # Extract representations
        reps = self.extract_representations(texts)
        labels_tensor = torch.tensor(labels)
        
        # Create probe
        hidden_size = reps.shape[1]
        num_classes = len(set(labels))
        probe = LinearProbe(hidden_size, num_classes)
        
        # Train
        optimizer = torch.optim.Adam(probe.parameters(), lr=0.01)
        criterion = nn.CrossEntropyLoss()
        
        for epoch in range(epochs):
            optimizer.zero_grad()
            logits = probe(reps)
            loss = criterion(logits, labels_tensor)
            loss.backward()
            optimizer.step()
        
        # Compute accuracy
        with torch.no_grad():
            preds = probe(reps).argmax(dim=1)
            accuracy = (preds == labels_tensor).float().mean().item()
        
        self.probes[concept] = probe
        return accuracy
    
    def probe(self, concept: str, text: str) -> int:
        """Use trained probe to classify text."""
        if concept not in self.probes:
            raise ValueError(f"No probe trained for {concept}")
        
        rep = self.extract_representations([text])
        logits = self.probes[concept](rep)
        return logits.argmax(dim=1).item()

def layer_wise_probing(model, tokenizer, texts: List[str], 
                      labels: List[int], num_layers: int) -> List[float]:
    """Probe each layer to see where information emerges."""
    accuracies = []
    
    for layer_idx in range(num_layers):
        prober = ProbingClassifier(model, tokenizer, layer_index=layer_idx)
        acc = prober.train_probe("concept", texts, labels)
        accuracies.append(acc)
    
    return accuracies
