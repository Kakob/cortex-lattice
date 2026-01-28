"""Safety Testing Framework"""
import numpy as np
from typing import List, Dict, Callable
from dataclasses import dataclass
from scipy import stats

@dataclass
class TestCase:
    category: str
    prompt: str
    expected_behavior: str
    severity: str  # "critical", "high", "medium", "low"

@dataclass
class TestResult:
    passed: bool
    score: float
    details: str

class SafetyTestSuite:
    """Collection of safety tests."""
    
    def __init__(self):
        self.test_cases: List[TestCase] = []
        self.evaluators: Dict[str, Callable] = {}
    
    def add_test(self, test: TestCase):
        self.test_cases.append(test)
    
    def add_evaluator(self, category: str, evaluator: Callable):
        self.evaluators[category] = evaluator
    
    def run(self, model) -> Dict:
        results = {"passed": 0, "failed": 0, "by_category": {}}
        
        for test in self.test_cases:
            response = model.generate(test.prompt)
            evaluator = self.evaluators.get(test.category, self._default_eval)
            result = evaluator(response, test.expected_behavior)
            
            if result.passed:
                results["passed"] += 1
            else:
                results["failed"] += 1
            
            if test.category not in results["by_category"]:
                results["by_category"][test.category] = []
            results["by_category"][test.category].append(result)
        
        return results
    
    def _default_eval(self, response, expected) -> TestResult:
        return TestResult(True, 1.0, "Default pass")

class StatisticalTester:
    """Statistical significance testing for safety metrics."""
    
    @staticmethod
    def compare_models(scores_a: List[float], scores_b: List[float]) -> Dict:
        """Compare two models using t-test."""
        t_stat, p_value = stats.ttest_ind(scores_a, scores_b)
        
        mean_diff = np.mean(scores_a) - np.mean(scores_b)
        pooled_std = np.sqrt((np.std(scores_a)**2 + np.std(scores_b)**2) / 2)
        effect_size = mean_diff / (pooled_std + 1e-8)  # Cohen's d
        
        return {
            "t_statistic": t_stat,
            "p_value": p_value,
            "effect_size": effect_size,
            "significant": p_value < 0.05,
            "mean_a": np.mean(scores_a),
            "mean_b": np.mean(scores_b),
        }
    
    @staticmethod
    def detect_regression(baseline: List[float], current: List[float], threshold: float = 0.05) -> bool:
        """Detect if current performance regressed from baseline."""
        result = StatisticalTester.compare_models(current, baseline)
        # Regression = significantly worse AND meaningful effect size
        return result["significant"] and result["effect_size"] < -0.2

# Example test categories
SAFETY_CATEGORIES = [
    "harmful_instructions",
    "bias_stereotypes", 
    "misinformation",
    "privacy_leakage",
    "jailbreak_resistance",
]
