/**
 * Problem Writer Utility (Client-safe)
 *
 * Converts form data to YAML format.
 * This module is safe to import in client components.
 */

import { stringify } from "yaml";
import { ProblemFormData } from "@/lib/schemas/problemSchema";

/**
 * Convert form data to YAML-ready object
 */
export function formDataToYaml(data: ProblemFormData): Record<string, unknown> {
  // Start with required fields in desired order
  const yamlObj: Record<string, unknown> = {
    id: data.id,
    title: data.title,
    difficulty: data.difficulty,
    pattern: data.pattern,
  };

  // Add optional basic fields
  if (data.theme) yamlObj.theme = data.theme;
  if (data.estimatedTime) yamlObj.estimated_time = data.estimatedTime;

  // Add description
  yamlObj.description = data.description;

  // Add story context if present
  if (data.storyContext) yamlObj.story_context = data.storyContext;

  // Add examples
  yamlObj.examples = data.examples.map((ex) => ({
    input: ex.input,
    output: ex.output,
    explanation: ex.explanation,
  }));

  // Add constraints
  yamlObj.constraints = data.constraints;

  // Add hints
  yamlObj.hints = data.hints.map((hint) => ({
    level: hint.level,
    text: hint.text,
  }));

  // Add starter code
  yamlObj.starter_code_python = data.starterCodePython;
  if (data.starterCodeJavascript) {
    yamlObj.starter_code_javascript = data.starterCodeJavascript;
  }

  // Add test cases
  yamlObj.test_cases = data.testCases.map((tc) => {
    const testCase: Record<string, unknown> = {
      id: tc.id,
      input: tc.input,
      expected: tc.expected,
    };
    if (tc.explanation) testCase.explanation = tc.explanation;
    return testCase;
  });

  // Add optional advanced fields
  if (data.edgeCases && data.edgeCases.length > 0) {
    yamlObj.edge_cases = data.edgeCases.map((ec) => ({
      case: ec.case,
      description: ec.description,
      test_id: ec.testId,
    }));
  }

  if (data.patternLearningObjectives && data.patternLearningObjectives.length > 0) {
    yamlObj.pattern_learning_objectives = data.patternLearningObjectives;
  }

  if (data.realWorldApplications && data.realWorldApplications.length > 0) {
    yamlObj.real_world_applications = data.realWorldApplications;
  }

  if (data.complexityAnalysis) {
    yamlObj.complexity_analysis = {
      time: {
        ...(data.complexityAnalysis.time.naive && {
          naive: data.complexityAnalysis.time.naive,
        }),
        optimal: data.complexityAnalysis.time.optimal,
      },
      space: {
        optimal: data.complexityAnalysis.space.optimal,
      },
    };
  }

  if (data.patternSignature) {
    yamlObj.pattern_signature = {
      ...(data.patternSignature.indicators && {
        indicators: data.patternSignature.indicators,
      }),
      pattern_name: data.patternSignature.patternName,
      ...(data.patternSignature.whenToUse && {
        when_to_use: data.patternSignature.whenToUse,
      }),
    };
  }

  return yamlObj;
}

/**
 * Convert form data to YAML string
 */
export function toYamlString(data: ProblemFormData): string {
  const yamlObj = formDataToYaml(data);
  return stringify(yamlObj, {
    lineWidth: 0, // Don't wrap long lines
    defaultStringType: "PLAIN",
    defaultKeyType: "PLAIN",
  });
}
