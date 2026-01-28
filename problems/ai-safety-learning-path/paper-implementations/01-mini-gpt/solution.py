"""
Mini-GPT from Scratch - Complete Implementation

This implements a GPT-style transformer language model following the
"Attention Is All You Need" architecture with decoder-only modifications.

Key components:
1. Token + Positional Embeddings
2. Multi-Head Self-Attention (with causal masking)
3. Feed-Forward Network
4. Transformer Blocks with residual connections
5. Autoregressive text generation

Author: AI Safety Learning Path
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math
from typing import Optional


class MultiHeadAttention(nn.Module):
    """
    Multi-head self-attention mechanism.
    
    Splits input into multiple heads, applies attention in parallel,
    then concatenates and projects back.
    
    For causal (decoder) attention, a mask prevents attending to future tokens.
    """
    
    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0, "d_model must be divisible by n_heads"
        
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads  # Dimension per head
        
        # Linear projections for Q, K, V (can be combined for efficiency)
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        
        # Output projection
        self.W_o = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(self.d_k)
    
    def forward(
        self, 
        x: torch.Tensor, 
        mask: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        Args:
            x: Input tensor (batch, seq_len, d_model)
            mask: Causal mask (seq_len, seq_len) or None
        
        Returns:
            Output tensor (batch, seq_len, d_model)
        """
        batch_size, seq_len, _ = x.shape
        
        # Project to Q, K, V
        Q = self.W_q(x)  # (batch, seq, d_model)
        K = self.W_k(x)
        V = self.W_v(x)
        
        # Reshape for multi-head: (batch, seq, n_heads, d_k) -> (batch, n_heads, seq, d_k)
        Q = Q.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        
        # Attention scores: (batch, n_heads, seq, seq)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale
        
        # Apply causal mask (prevent attending to future)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))
        
        # Softmax over keys dimension
        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)
        
        # Weighted sum of values
        context = torch.matmul(attention_weights, V)  # (batch, n_heads, seq, d_k)
        
        # Concatenate heads: (batch, seq, n_heads, d_k) -> (batch, seq, d_model)
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)
        
        # Final projection
        output = self.W_o(context)
        
        return output


class FeedForward(nn.Module):
    """
    Position-wise feed-forward network.
    
    Two linear transformations with GELU activation:
    FFN(x) = GELU(x @ W1 + b1) @ W2 + b2
    
    Typically d_ff = 4 * d_model
    """
    
    def __init__(self, d_model: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # GELU is smoother than ReLU, used in GPT-2/3
        x = F.gelu(self.linear1(x))
        x = self.dropout(x)
        x = self.linear2(x)
        return x


class TransformerBlock(nn.Module):
    """
    Single transformer block.
    
    Pre-norm architecture (GPT-2 style):
    x = x + Attention(LayerNorm(x))
    x = x + FFN(LayerNorm(x))
    """
    
    def __init__(
        self, 
        d_model: int, 
        n_heads: int, 
        d_ff: int, 
        dropout: float = 0.1
    ):
        super().__init__()
        
        self.attention = MultiHeadAttention(d_model, n_heads, dropout)
        self.ff = FeedForward(d_model, d_ff, dropout)
        
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)
        
        self.dropout = nn.Dropout(dropout)
    
    def forward(
        self, 
        x: torch.Tensor, 
        mask: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        # Pre-norm + attention + residual
        x = x + self.dropout(self.attention(self.ln1(x), mask))
        
        # Pre-norm + FFN + residual
        x = x + self.dropout(self.ff(self.ln2(x)))
        
        return x


class MiniGPT(nn.Module):
    """
    Complete GPT-style language model.
    
    Architecture:
    1. Token embedding + positional embedding
    2. Stack of transformer blocks
    3. Final layer norm
    4. Linear projection to vocabulary
    """
    
    def __init__(
        self,
        vocab_size: int,
        d_model: int = 256,
        n_heads: int = 4,
        n_layers: int = 4,
        d_ff: int = 1024,
        max_seq_len: int = 512,
        dropout: float = 0.1
    ):
        super().__init__()
        
        self.d_model = d_model
        self.max_seq_len = max_seq_len
        
        # Embeddings
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.position_embedding = nn.Embedding(max_seq_len, d_model)
        
        self.dropout = nn.Dropout(dropout)
        
        # Transformer blocks
        self.blocks = nn.ModuleList([
            TransformerBlock(d_model, n_heads, d_ff, dropout)
            for _ in range(n_layers)
        ])
        
        # Final layer norm (GPT-2 style)
        self.ln_f = nn.LayerNorm(d_model)
        
        # Output projection (often tied with token embedding)
        self.head = nn.Linear(d_model, vocab_size, bias=False)
        
        # Weight tying (optional but common)
        self.head.weight = self.token_embedding.weight
        
        # Initialize weights
        self.apply(self._init_weights)
        
        # Create causal mask
        self.register_buffer(
            "causal_mask",
            torch.tril(torch.ones(max_seq_len, max_seq_len))
        )
    
    def _init_weights(self, module):
        """Initialize weights following GPT-2."""
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Token IDs (batch, seq_len)
        
        Returns:
            Logits (batch, seq_len, vocab_size)
        """
        batch_size, seq_len = x.shape
        assert seq_len <= self.max_seq_len, f"Sequence too long: {seq_len} > {self.max_seq_len}"
        
        # Token embeddings
        tok_emb = self.token_embedding(x)  # (batch, seq, d_model)
        
        # Position embeddings
        positions = torch.arange(seq_len, device=x.device)
        pos_emb = self.position_embedding(positions)  # (seq, d_model)
        
        # Combine embeddings
        x = self.dropout(tok_emb + pos_emb)
        
        # Get causal mask for this sequence length
        mask = self.causal_mask[:seq_len, :seq_len]
        
        # Apply transformer blocks
        for block in self.blocks:
            x = block(x, mask)
        
        # Final layer norm
        x = self.ln_f(x)
        
        # Project to vocabulary
        logits = self.head(x)  # (batch, seq, vocab_size)
        
        return logits
    
    @torch.no_grad()
    def generate(
        self,
        prompt: torch.Tensor,
        max_new_tokens: int,
        temperature: float = 1.0,
        top_k: Optional[int] = None,
        top_p: Optional[float] = None
    ) -> torch.Tensor:
        """
        Autoregressive text generation.
        
        Args:
            prompt: Starting token IDs (batch, prompt_len)
            max_new_tokens: Number of tokens to generate
            temperature: Sampling temperature (1.0 = normal, <1 = sharper, >1 = softer)
            top_k: If set, only sample from top k tokens
            top_p: If set, nucleus sampling threshold
        
        Returns:
            Generated sequence (batch, prompt_len + max_new_tokens)
        """
        self.eval()
        
        for _ in range(max_new_tokens):
            # Truncate if needed
            x = prompt if prompt.size(1) <= self.max_seq_len else prompt[:, -self.max_seq_len:]
            
            # Get logits for last position
            logits = self.forward(x)[:, -1, :]  # (batch, vocab_size)
            
            # Apply temperature
            logits = logits / temperature
            
            # Top-k filtering
            if top_k is not None:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float('-inf')
            
            # Top-p (nucleus) filtering
            if top_p is not None:
                sorted_logits, sorted_indices = torch.sort(logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                
                # Remove tokens with cumulative prob above threshold
                sorted_indices_to_remove = cumulative_probs > top_p
                sorted_indices_to_remove[:, 1:] = sorted_indices_to_remove[:, :-1].clone()
                sorted_indices_to_remove[:, 0] = 0
                
                indices_to_remove = sorted_indices_to_remove.scatter(
                    1, sorted_indices, sorted_indices_to_remove
                )
                logits[indices_to_remove] = float('-inf')
            
            # Sample
            probs = F.softmax(logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)
            
            # Append to sequence
            prompt = torch.cat([prompt, next_token], dim=1)
        
        return prompt


def train_mini_gpt(
    model: MiniGPT,
    train_data: torch.Tensor,
    epochs: int = 10,
    batch_size: int = 32,
    lr: float = 3e-4,
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
):
    """
    Training loop for Mini-GPT.
    
    Uses AdamW optimizer with cosine learning rate schedule and gradient clipping.
    """
    model = model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    
    # Cosine annealing schedule
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    model.train()
    for epoch in range(epochs):
        total_loss = 0
        n_batches = 0
        
        # Create batches
        for i in range(0, len(train_data) - batch_size, batch_size):
            batch = train_data[i:i+batch_size].to(device)
            
            # Input: all but last token, Target: all but first token
            inputs = batch[:, :-1]
            targets = batch[:, 1:]
            
            # Forward pass
            logits = model(inputs)
            
            # Cross-entropy loss
            loss = F.cross_entropy(
                logits.reshape(-1, logits.size(-1)),
                targets.reshape(-1)
            )
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()
            
            total_loss += loss.item()
            n_batches += 1
        
        scheduler.step()
        avg_loss = total_loss / n_batches
        print(f"Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}")
    
    return model


if __name__ == "__main__":
    # Quick test
    print("Testing Mini-GPT implementation...")
    
    # Create model
    model = MiniGPT(
        vocab_size=1000,
        d_model=128,
        n_heads=4,
        n_layers=2,
        d_ff=512,
        max_seq_len=64
    )
    
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Test forward pass
    batch = torch.randint(0, 1000, (2, 32))
    logits = model(batch)
    print(f"Input shape: {batch.shape}")
    print(f"Output shape: {logits.shape}")
    
    # Test generation
    prompt = torch.randint(0, 1000, (1, 5))
    generated = model.generate(prompt, max_new_tokens=10, temperature=0.8)
    print(f"Prompt shape: {prompt.shape}")
    print(f"Generated shape: {generated.shape}")
    
    print("\n✓ All tests passed!")
