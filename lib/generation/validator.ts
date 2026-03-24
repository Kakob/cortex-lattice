/**
 * Structural validation for generated problem files.
 * Uses Zod schemas to validate each YAML file type.
 */

import { z } from "zod";

// ============================================================================
// core.yaml schema
// ============================================================================

export const coreSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with hyphens"),
  pattern: z.union([z.string(), z.array(z.string())]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().optional(),
  estimated_time: z.string().optional(),
  constraints: z.array(z.string()).min(1),
  test_case_data: z
    .array(
      z.object({
        id: z.string().min(1),
        input: z.record(z.string(), z.unknown()),
        expected: z.unknown(),
      })
    )
    .min(6, "Need at least 6 test cases"),
  edge_cases: z
    .array(
      z.object({
        case: z.string(),
        description: z.string(),
        test_id: z.string(),
      })
    )
    .optional(),
  complexity_analysis: z
    .object({
      time: z.object({
        naive: z.string().optional(),
        optimal: z.string(),
      }),
      space: z.object({
        optimal: z.string(),
      }),
    })
    .optional(),
  pattern_signature: z
    .object({
      indicators: z.array(z.string()).optional(),
      pattern_name: z.string(),
      when_to_use: z.array(z.string()).optional(),
    })
    .optional(),
  pattern_learning_objectives: z.array(z.string()).optional(),
  real_world_applications: z.array(z.string()).optional(),
  data_structures: z
    .array(
      z.object({
        name: z.string(),
        code_python: z.string(),
      })
    )
    .optional(),
});

// ============================================================================
// problem.yaml (themed) schema
// ============================================================================

export const themedProblemSchema = z.object({
  title: z.string().min(1),
  function_name: z.string().min(1),
  description: z.string().min(10),
  story_context: z.string().optional(),
  examples: z
    .array(
      z.object({
        input: z.record(z.string(), z.unknown()),
        output: z.unknown(),
        explanation: z.string(),
      })
    )
    .min(2),
  hints: z
    .array(
      z.object({
        level: z.number().int().min(1).max(5),
        text: z.string().min(1),
      })
    )
    .min(2),
  starter_code_python: z.string().min(1),
  starter_code_javascript: z.string().optional(),
  test_case_explanations: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// solution.yaml schema
// ============================================================================

export const solutionSchema = z.object({
  id: z.string().optional(),
  pattern: z.string().optional(),
  difficulty: z.string().optional(),
  solution_code_python: z.string().min(1),
  solution_code_javascript: z.string().optional(),
  approach_explanation: z
    .object({
      core_insight: z.string(),
      step_by_step: z.array(
        z.object({
          step: z.number(),
          action: z.string(),
          why: z.string().optional(),
          cases: z.array(z.string()).optional(),
        })
      ),
    })
    .optional(),
  alternative_solutions: z
    .array(
      z.object({
        name: z.string(),
        approach: z.string(),
        complexity: z.object({
          time: z.string(),
          space: z.string(),
        }),
        when_to_use: z.string().optional(),
      })
    )
    .optional(),
});

// ============================================================================
// guidance.yaml schema
// ============================================================================

export const guidanceSchema = z.object({
  title: z.string().optional(),
  pattern: z.string().optional(),
  hints: z.object({
    key_concepts: z.array(z.object({ text: z.string() })).optional(),
    common_mistakes: z.array(z.object({ text: z.string() })).optional(),
    real_world: z.array(z.object({ text: z.string() })).optional(),
    solution_approach: z
      .object({
        steps: z.array(z.string()),
      })
      .optional(),
  }),
  complexity: z
    .object({
      time: z.string(),
      space: z.string(),
    })
    .optional(),
  pattern_transfer: z
    .object({
      similar_problems: z
        .array(
          z.object({
            name: z.string(),
            invariants_shared: z.array(z.string()).optional(),
            difference: z.string().optional(),
            modification: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

// ============================================================================
// invariants.yaml schema
// ============================================================================

const invariantItem = z.object({
  id: z.string(),
  description: z.string(),
  why_it_matters: z.string().optional(),
  violation_detection: z.union([z.array(z.string()), z.record(z.string(), z.unknown())]).optional(),
  teaching_moment_if_violated: z.string().optional(),
});

export const invariantsSchema = z.object({
  pattern: z.string().optional(),
  problem_id: z.string().optional(),
  core_invariants: z.array(invariantItem).optional(),
  algorithm_correctness_invariants: z.array(invariantItem).optional(),
  efficiency_invariants: z.array(invariantItem).optional(),
  pattern_recognition_invariants: z.array(invariantItem).optional(),
});

// ============================================================================
// mistakes.yaml schema
// ============================================================================

export const mistakesSchema = z.object({
  common_mistakes: z.array(
    z.object({
      id: z.string(),
      severity: z.string().optional(),
      category: z.string().optional(),
      description: z.string(),
      teaching_moment: z
        .object({
          title: z.string(),
          explanation: z.string(),
          hint: z.string().optional(),
          next_step: z.string().optional(),
        })
        .optional(),
    })
  ),
});

// ============================================================================
// Validation functions
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCore(data: unknown): ValidationResult {
  return validate(coreSchema, data, "core.yaml");
}

export function validateThemedProblem(data: unknown): ValidationResult {
  return validate(themedProblemSchema, data, "problem.yaml");
}

export function validateSolution(data: unknown): ValidationResult {
  return validate(solutionSchema, data, "solution.yaml");
}

export function validateGuidance(data: unknown): ValidationResult {
  return validate(guidanceSchema, data, "guidance.yaml");
}

export function validateInvariants(data: unknown): ValidationResult {
  return validate(invariantsSchema, data, "invariants.yaml");
}

export function validateMistakes(data: unknown): ValidationResult {
  return validate(mistakesSchema, data, "mistakes.yaml");
}

function validate(
  schema: z.ZodType,
  data: unknown,
  fileName: string
): ValidationResult {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.issues.map(
    (issue) => `${fileName}: ${issue.path.join(".")} - ${issue.message}`
  );
  return { valid: false, errors };
}

/**
 * Cross-validate that edge case test_ids reference existing test cases.
 */
export function crossValidateCore(coreData: z.infer<typeof coreSchema>): ValidationResult {
  const errors: string[] = [];
  const testIds = new Set(coreData.test_case_data.map((tc) => tc.id));

  // Check edge case references
  if (coreData.edge_cases) {
    for (const ec of coreData.edge_cases) {
      if (!testIds.has(ec.test_id)) {
        errors.push(
          `Edge case "${ec.case}" references test_id "${ec.test_id}" which doesn't exist`
        );
      }
    }
  }

  // Check for duplicate test IDs
  if (testIds.size < coreData.test_case_data.length) {
    errors.push("Duplicate test case IDs found");
  }

  return { valid: errors.length === 0, errors };
}
