import math

class RunningStats:
    """
    Welford's online algorithm for computing mean and variance.
    
    Key insight: Maintain M2 = Σ(x - mean)² incrementally.
    
    Time: O(1) per update
    Space: O(1) total
    
    Used in: PPO observation normalization, reward scaling
    """
    
    def __init__(self):
        self.n = 0
        self._mean = 0.0
        self._M2 = 0.0  # Sum of squared deviations
    
    def update(self, x: float):
        """Update with new sample using Welford's algorithm."""
        self.n += 1
        delta = x - self._mean
        self._mean += delta / self.n
        delta2 = x - self._mean  # Note: using updated mean!
        self._M2 += delta * delta2
    
    def mean(self) -> float:
        return self._mean
    
    def variance(self) -> float:
        if self.n < 2:
            return 0.0
        return self._M2 / self.n  # Population variance
    
    def sample_variance(self) -> float:
        """Unbiased sample variance (divide by n-1)."""
        if self.n < 2:
            return 0.0
        return self._M2 / (self.n - 1)
    
    def std(self) -> float:
        return math.sqrt(self.variance())
    
    def normalize(self, x: float, epsilon: float = 1e-8) -> float:
        """Normalize x to zero mean, unit variance."""
        return (x - self._mean) / (self.std() + epsilon)
    
    def merge(self, other: 'RunningStats') -> 'RunningStats':
        """Merge two RunningStats (useful for parallel computation)."""
        if self.n == 0:
            return other
        if other.n == 0:
            return self
        
        combined = RunningStats()
        combined.n = self.n + other.n
        
        delta = other._mean - self._mean
        combined._mean = (self.n * self._mean + other.n * other._mean) / combined.n
        combined._M2 = (self._M2 + other._M2 + 
                       delta * delta * self.n * other.n / combined.n)
        
        return combined


class RunningMeanStd:
    """
    Multi-dimensional version for observation normalization.
    Tracks mean and std for each dimension independently.
    """
    
    def __init__(self, shape: tuple):
        self.shape = shape
        self.mean = [0.0] * shape[0]
        self.var = [1.0] * shape[0]
        self.count = 0
    
    def update(self, batch):
        """Update with batch of observations."""
        batch_mean = [sum(x[i] for x in batch) / len(batch) for i in range(self.shape[0])]
        batch_var = [sum((x[i] - batch_mean[i])**2 for x in batch) / len(batch) 
                     for i in range(self.shape[0])]
        batch_count = len(batch)
        
        self._update_from_moments(batch_mean, batch_var, batch_count)
    
    def _update_from_moments(self, batch_mean, batch_var, batch_count):
        delta = [bm - m for bm, m in zip(batch_mean, self.mean)]
        total_count = self.count + batch_count
        
        self.mean = [m + d * batch_count / total_count 
                     for m, d in zip(self.mean, delta)]
        
        m_a = [v * self.count for v in self.var]
        m_b = [v * batch_count for v in batch_var]
        M2 = [a + b + d*d * self.count * batch_count / total_count 
              for a, b, d in zip(m_a, m_b, delta)]
        
        self.var = [m / total_count for m in M2]
        self.count = total_count
    
    def normalize(self, obs, epsilon=1e-8):
        return [(o - m) / (math.sqrt(v) + epsilon) 
                for o, m, v in zip(obs, self.mean, self.var)]


if __name__ == "__main__":
    # Test Welford's algorithm
    stats = RunningStats()
    
    samples = [10, 20, 30]
    for x in samples:
        stats.update(x)
    
    print("Running Statistics Test")
    print(f"Samples: {samples}")
    print(f"Mean: {stats.mean():.2f}")
    print(f"Variance: {stats.variance():.2f}")
    print(f"Std: {stats.std():.2f}")
    
    # Verify against numpy
    import numpy as np
    np_mean = np.mean(samples)
    np_var = np.var(samples)
    print(f"\nNumPy mean: {np_mean:.2f}")
    print(f"NumPy var: {np_var:.2f}")
