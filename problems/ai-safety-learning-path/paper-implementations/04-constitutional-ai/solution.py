"""Constitutional AI Implementation"""
from typing import List
from dataclasses import dataclass

@dataclass
class Principle:
    name: str
    critique_prompt: str
    revision_prompt: str

CONSTITUTION = [
    Principle("harmlessness", "Identify harmful content.", "Remove harmful content."),
    Principle("honesty", "Check truthfulness.", "Be more honest."),
]

class ConstitutionalAI:
    def __init__(self, model, constitution=None):
        self.model = model
        self.constitution = constitution or CONSTITUTION
    
    def critique_and_revise(self, prompt, response):
        """Apply all principles to revise response."""
        current = response
        for principle in self.constitution:
            critique = self._critique(prompt, current, principle)
            current = self._revise(prompt, current, critique, principle)
        return current
    
    def _critique(self, prompt, response, principle):
        return self.model.generate(f"Critique: {principle.critique_prompt}\n{response}")
    
    def _revise(self, prompt, response, critique, principle):
        return self.model.generate(f"Revise based on: {critique}\n{response}")

def generate_ai_preference(model, prompt, response_a, response_b, principle):
    """Use model to choose which response better follows principle."""
    pref_prompt = f"""Which response better follows: {principle.name}?
A: {response_a}
B: {response_b}
Answer (A or B):"""
    return model.generate(pref_prompt).strip()
