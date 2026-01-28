/**
 * Zod Schema for Problem Validation
 *
 * Validates problem.yaml structure for the admin problem creation form.
 * Based on the Problem interface from lib/types.ts
 */

import { z } from "zod";

// Example schema
export const problemExampleSchema = z.object({
  input: z.record(z.string(), z.unknown()),
  output: z.unknown(),
  explanation: z.string().min(1, "Explanation is required"),
});

// Hint schema
export const problemHintSchema = z.object({
  level: z.number().int().min(1).max(5),
  text: z.string().min(1, "Hint text is required"),
});

// Test case schema
export const testCaseSchema = z.object({
  id: z.string().min(1, "Test case ID is required"),
  input: z.record(z.string(), z.unknown()),
  expected: z.unknown(),
  explanation: z.string().optional(),
});

// Edge case schema
export const edgeCaseSchema = z.object({
  case: z.string().min(1, "Case name is required"),
  description: z.string().min(1, "Description is required"),
  testId: z.string().min(1, "Test ID reference is required"),
});

// Complexity analysis schema
export const complexityAnalysisSchema = z.object({
  time: z.object({
    naive: z.string().optional(),
    optimal: z.string().min(1, "Optimal time complexity is required"),
  }),
  space: z.object({
    optimal: z.string().min(1, "Optimal space complexity is required"),
  }),
});

// Pattern signature schema
export const patternSignatureSchema = z.object({
  indicators: z.array(z.string()).optional(),
  patternName: z.string().min(1, "Pattern name is required"),
  whenToUse: z.array(z.string()).optional(),
});

// Main problem schema
export const problemSchema = z.object({
  // Required fields
  id: z
    .string()
    .min(1, "ID is required")
    .regex(
      /^[a-z0-9-]+$/,
      "ID must be lowercase alphanumeric with hyphens only"
    ),
  title: z.string().min(1, "Title is required"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    message: "Please select a difficulty level",
  }),
  pattern: z.union([z.string(), z.array(z.string())]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  examples: z
    .array(problemExampleSchema)
    .min(1, "At least one example is required"),
  constraints: z
    .array(z.string().min(1))
    .min(1, "At least one constraint is required"),
  hints: z.array(problemHintSchema).min(1, "At least one hint is required"),
  starterCodePython: z
    .string()
    .min(1, "Python starter code is required"),
  testCases: z
    .array(testCaseSchema)
    .min(3, "At least 3 test cases are required"),

  // Optional fields
  theme: z.string().optional(),
  estimatedTime: z.string().optional(),
  storyContext: z.string().optional(),
  starterCodeJavascript: z.string().optional(),
  edgeCases: z.array(edgeCaseSchema).optional(),
  patternLearningObjectives: z.array(z.string()).optional(),
  realWorldApplications: z.array(z.string()).optional(),
  complexityAnalysis: complexityAnalysisSchema.optional(),
  patternSignature: patternSignatureSchema.optional(),
});

export type ProblemFormData = z.infer<typeof problemSchema>;

// Default values for form initialization
export const defaultProblemValues: Partial<ProblemFormData> = {
  difficulty: "medium",
  examples: [{ input: {}, output: null, explanation: "" }],
  constraints: [""],
  hints: [{ level: 1, text: "" }],
  testCases: [
    { id: "test-1", input: {}, expected: null, explanation: "" },
    { id: "test-2", input: {}, expected: null, explanation: "" },
    { id: "test-3", input: {}, expected: null, explanation: "" },
  ],
  starterCodePython: `def solution():
    """
    Your solution here.

    Args:

    Returns:

    """
    pass
`,
};
