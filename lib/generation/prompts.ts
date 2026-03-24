/**
 * Prompt builders for AI-assisted problem generation.
 *
 * Two-phase generation:
 *   Phase A: core.yaml + solution.yaml (functionally verified via Docker)
 *   Phase B: themed problem.yaml + guidance.yaml + mistakes.yaml + invariants.yaml
 */

import { PATTERNS, THEME_INFO, type PatternInfo } from "./patterns";

export interface GenerationSpec {
  curriculumTitle: string;
  normalizedTitle: string;
  patternKey: string;
  difficulty: "easy" | "medium" | "hard";
  index: number;
  problemId: string;
  themes: string[];
}

// ============================================================================
// Phase A: Core + Solution
// ============================================================================

export function buildPhaseAPrompt(
  spec: GenerationSpec,
  exemplarCore: string,
  exemplarSolution: string
): string {
  const pattern = PATTERNS[spec.patternKey];
  if (!pattern) {
    throw new Error(`Unknown pattern: ${spec.patternKey}`);
  }

  return `You are generating a coding problem for Cortex Lattice, a platform for learning algorithms through domain-based problem solving.

## Your Task

Generate TWO files for the problem "${spec.curriculumTitle}" (${spec.difficulty} difficulty, ${pattern.name} pattern):

1. **core.yaml** — Algorithm-invariant definition (test cases, constraints, complexity)
2. **solution.yaml** — Reference solution with explanation

## Requirements

### Problem Design
- The algorithm must match what "${spec.curriculumTitle}" tests (this is a well-known coding interview problem)
- Write an ORIGINAL problem description — do NOT copy text from LeetCode, DesignGurus, or any other source
- The problem ID must be: \`${spec.problemId}\`
- Difficulty: ${spec.difficulty}
- Pattern: ${spec.patternKey}

### core.yaml Requirements
- At least 8 test cases covering: basic examples (2-3), edge cases (2-3), and standard cases (3-4)
- Each test case needs a unique string ID (kebab-case)
- Input is a dictionary of named parameters (not positional)
- Constraints must specify input bounds
- Include complexity_analysis (naive and optimal time, optimal space)
- Include pattern_signature, pattern_learning_objectives, and real_world_applications
- Include edge_cases that reference test_id values from test_case_data

### solution.yaml Requirements
- Working Python solution (MUST be correct — it will be verified against test cases)
- JavaScript solution
- approach_explanation with core_insight and step_by_step
- At least 1 alternative_solution (typically brute force)

## Pattern Context

**${pattern.name}**: ${pattern.description}

**When to use**: ${pattern.whenToUse}

**Code template**:
\`\`\`python
${pattern.template}
\`\`\`

**Key concepts**: ${pattern.keyConcepts.join("; ")}

## Exemplar (quality reference)

Here is an example of the quality and structure expected:

### Example core.yaml:
\`\`\`yaml
${exemplarCore}
\`\`\`

### Example solution.yaml:
\`\`\`yaml
${exemplarSolution}
\`\`\`

## Output Format

Output exactly two YAML file blocks with these delimiters:

--- FILE: core.yaml ---
\`\`\`yaml
<core.yaml content>
\`\`\`

--- FILE: solution.yaml ---
\`\`\`yaml
<solution.yaml content>
\`\`\`

IMPORTANT:
- The solution code MUST actually work and pass all test cases
- Test case inputs must match the function signature
- Use the problem ID "${spec.problemId}" in both files
- category should be "software-engineering"
- Do NOT include any text outside the YAML blocks`;
}

// ============================================================================
// Phase B: Themed Content
// ============================================================================

export function buildPhaseBPrompt(
  spec: GenerationSpec,
  themeId: string,
  coreYaml: string,
  solutionYaml: string,
  exemplarProblem: string,
  exemplarGuidance: string
): string {
  const pattern = PATTERNS[spec.patternKey];
  const theme = THEME_INFO[themeId];

  if (!pattern) throw new Error(`Unknown pattern: ${spec.patternKey}`);
  if (!theme) throw new Error(`Unknown theme: ${themeId}`);

  return `You are generating themed content for a coding problem on Cortex Lattice.

## Context

The algorithm-invariant definition (core.yaml) and solution already exist. You need to create themed presentation files for the **"${theme.displayName}"** theme.

### Theme: ${theme.displayName}
${theme.flavor}

### The Core Problem (algorithm-invariant):
\`\`\`yaml
${coreYaml}
\`\`\`

### The Solution:
\`\`\`yaml
${solutionYaml}
\`\`\`

## Your Task

Generate FOUR files for the "${theme.displayName}" theme:

### 1. problem.yaml — Themed presentation
- **title**: A creative, theme-appropriate title (not just the algorithm name)
- **function_name**: A snake_case function name that fits the theme
- **description**: Problem statement rewritten with theme-appropriate context and vocabulary
- **story_context** (optional): A brief narrative setup for the problem
- **examples**: 2-3 examples using the SAME inputs/outputs from core.yaml's test_case_data, but with themed explanations
- **hints**: 3 hints (levels 1-3) — progressive, theme-aware
- **starter_code_python**: Function skeleton with themed parameter names and docstring
- **starter_code_javascript**: Same in JS
- **test_case_explanations**: Map of test_id → short themed explanation

CRITICAL: The function parameters in starter_code MUST match the input keys in core.yaml's test_case_data exactly. The test runner passes inputs by key name. If core.yaml has \`input: {positions: [...], target_distance: 250}\`, the function must accept \`positions\` and \`target_distance\` as parameters.

### 2. guidance.yaml — Teaching content
- hints.key_concepts: 4-6 key insights
- hints.common_mistakes: 3-5 common errors
- hints.real_world: 1-2 themed real-world applications
- hints.solution_approach.steps: Step-by-step algorithm walkthrough
- complexity: time and space
- pattern_transfer.similar_problems: 2-3 related problems

### 3. mistakes.yaml — Common errors
- 3-5 common mistakes with id, severity, category, description, and teaching_moment

### 4. invariants.yaml — Algorithm correctness rules
- 3-5 core invariants that must hold for the algorithm to work correctly
- Each with: id, description, why_it_matters, violation_detection, teaching_moment_if_violated

## Exemplar (quality reference)

### Example problem.yaml (coding-interview theme):
\`\`\`yaml
${exemplarProblem}
\`\`\`

### Example guidance.yaml:
\`\`\`yaml
${exemplarGuidance}
\`\`\`

## Output Format

Output exactly four YAML file blocks:

--- FILE: problem.yaml ---
\`\`\`yaml
<content>
\`\`\`

--- FILE: guidance.yaml ---
\`\`\`yaml
<content>
\`\`\`

--- FILE: mistakes.yaml ---
\`\`\`yaml
<content>
\`\`\`

--- FILE: invariants.yaml ---
\`\`\`yaml
<content>
\`\`\`

IMPORTANT:
- Function parameter names in starter_code MUST exactly match the input keys from core.yaml test_case_data
- Examples must use real values from core.yaml's test_case_data
- All content should be themed with "${theme.displayName}" vocabulary and context
- Do NOT include text outside the YAML blocks`;
}

// ============================================================================
// Retry prompts
// ============================================================================

export function buildRetryPrompt(
  originalPrompt: string,
  errorOutput: string,
  attempt: number
): string {
  return `${originalPrompt}

## RETRY (Attempt ${attempt + 1})

The previous attempt failed with these errors:

\`\`\`
${errorOutput}
\`\`\`

Please fix the issues and regenerate. Make sure:
- All YAML is valid
- Test cases have correct expected values
- Solution code actually works
- Function parameter names match test case input keys exactly`;
}
