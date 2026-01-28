from typing import List
import math

def positional_encoding(seq_len: int, d_model: int) -> List[List[float]]:
    """
    Generate sinusoidal positional encodings.
    
    Formula:
    PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
    PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
    
    Why sinusoids?
    1. Can extrapolate to longer sequences (not learned)
    2. Relative positions can be computed via rotation
    3. Each dimension has different frequency (wavelength)
    
    Time: O(seq_len × d_model)
    Space: O(seq_len × d_model)
    """
    pe = [[0.0] * d_model for _ in range(seq_len)]
    
    for pos in range(seq_len):
        for i in range(0, d_model, 2):
            # Compute the angle/frequency
            # As i increases, frequency decreases (longer wavelength)
            angle = pos / (10000 ** (i / d_model))
            
            # Even indices: sin
            pe[pos][i] = math.sin(angle)
            
            # Odd indices: cos
            if i + 1 < d_model:
                pe[pos][i + 1] = math.cos(angle)
    
    return pe


def visualize_positional_encoding(seq_len: int, d_model: int):
    """Visualize the positional encoding patterns."""
    pe = positional_encoding(seq_len, d_model)
    
    print(f"Positional Encoding ({seq_len} positions, {d_model} dimensions)")
    print("=" * 60)
    
    # Show first few positions
    for pos in range(min(5, seq_len)):
        values = [f"{v:.4f}" for v in pe[pos][:8]]
        print(f"Position {pos}: [{', '.join(values)}...]")
    
    print("\nKey observations:")
    print("- Position 0 is all [0, 1, 0, 1, ...] (sin(0), cos(0))")
    print("- Low dimensions change rapidly (high frequency)")
    print("- High dimensions change slowly (low frequency)")
    print("- Each position has a unique 'signature'")


if __name__ == "__main__":
    visualize_positional_encoding(10, 8)
    
    # Test case
    pe = positional_encoding(3, 4)
    print("\nTest output:")
    for row in pe:
        print([round(x, 4) for x in row])
