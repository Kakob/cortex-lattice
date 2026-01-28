"""End-to-End Safety System"""
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class SafetyLevel(Enum):
    SAFE = "safe"
    WARNING = "warning"
    BLOCKED = "blocked"

@dataclass
class SafetyCheckResult:
    level: SafetyLevel
    issues: List[str]
    modified_response: Optional[str] = None

class EndToEndSafetySystem:
    """Complete AI safety pipeline."""
    
    def __init__(self, 
                 model,
                 prompt_detector,
                 output_filter,
                 reward_monitor,
                 test_suite,
                 constitution):
        self.model = model
        self.prompt_detector = prompt_detector
        self.output_filter = output_filter
        self.reward_monitor = reward_monitor
        self.test_suite = test_suite
        self.constitution = constitution
    
    def process_request(self, prompt: str) -> Tuple[str, SafetyCheckResult]:
        """Full safety pipeline for a single request."""
        issues = []
        
        # 1. Check input prompt
        is_adversarial, confidence, reason = self.prompt_detector.detect(prompt)
        if is_adversarial:
            if confidence > 0.9:
                return "", SafetyCheckResult(
                    SafetyLevel.BLOCKED,
                    [f"Adversarial prompt detected: {reason}"]
                )
            issues.append(f"Suspicious prompt (conf={confidence:.2f})")
        
        # 2. Generate response
        response = self.model.generate(prompt)
        
        # 3. Apply constitutional principles
        for principle in self.constitution:
            critique = self._critique(response, principle)
            if critique:
                response = self._revise(response, critique, principle)
                issues.append(f"Revised for: {principle.name}")
        
        # 4. Filter output
        filtered, filter_issues = self.output_filter.filter(response)
        issues.extend(filter_issues)
        
        # 5. Monitor for reward hacking patterns
        hack_alerts = self.reward_monitor.detect_anomaly(
            self._estimate_reward(filtered),
            self._extract_behavior(filtered)
        )
        issues.extend(hack_alerts)
        
        # Determine final safety level
        if len(issues) == 0:
            level = SafetyLevel.SAFE
        elif any("BLOCKED" in i for i in issues):
            level = SafetyLevel.BLOCKED
        else:
            level = SafetyLevel.WARNING
        
        return filtered, SafetyCheckResult(level, issues, filtered)
    
    def _critique(self, response, principle):
        # Simplified critique
        return None
    
    def _revise(self, response, critique, principle):
        return response
    
    def _estimate_reward(self, response):
        return len(response)  # Placeholder
    
    def _extract_behavior(self, response):
        return [hash(response) % 100]  # Placeholder
    
    def run_safety_tests(self) -> Dict:
        """Run full safety test suite."""
        return self.test_suite.run(self.model)
    
    def get_safety_report(self, interactions: List[Tuple[str, str]]) -> Dict:
        """Generate safety report from interaction history."""
        results = {
            "total": len(interactions),
            "safe": 0,
            "warning": 0,
            "blocked": 0,
            "issues_by_type": {}
        }
        
        for prompt, response in interactions:
            _, check = self.process_request(prompt)
            results[check.level.value] += 1
            
            for issue in check.issues:
                issue_type = issue.split(":")[0]
                results["issues_by_type"][issue_type] = results["issues_by_type"].get(issue_type, 0) + 1
        
        return results

class SafetyMonitoringDashboard:
    """Real-time safety monitoring."""
    
    def __init__(self, safety_system: EndToEndSafetySystem):
        self.system = safety_system
        self.history = []
    
    def log_interaction(self, prompt: str, response: str, result: SafetyCheckResult):
        self.history.append({
            "prompt": prompt[:100],
            "response": response[:100],
            "level": result.level.value,
            "issues": result.issues
        })
    
    def get_metrics(self) -> Dict:
        if not self.history:
            return {}
        
        levels = [h["level"] for h in self.history]
        return {
            "total_requests": len(self.history),
            "safe_rate": levels.count("safe") / len(levels),
            "warning_rate": levels.count("warning") / len(levels),
            "blocked_rate": levels.count("blocked") / len(levels),
        }
