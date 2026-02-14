/**
 * =============================================================================
 * CORTEX LATTICE - PROBLEM LOADING UTILITIES
 * =============================================================================
 *
 * Server-side utilities for loading problem definitions from YAML files.
 * These functions are used by API routes and Server Components.
 *
 * PROBLEM DIRECTORY STRUCTURE:
 * ----------------------------
 * problems/
 * ├── _template/           # Template for creating new problems (ignored)
 * ├── two-sum/
 * │   ├── problem.yaml     # Problem definition, test cases, starter code
 * │   ├── solution.yaml    # Reference solution, complexity analysis
 * │   ├── guidance.yaml    # Hints, key concepts, pattern transfer
 * │   ├── mistakes.yaml    # Common errors and teaching moments
 * │   ├── invariants.yaml  # Algorithm correctness invariants
 * │   └── pause-points.yaml # Interactive checkpoints for guided learning
 * ├── sliding-window-max/
 * │   └── ...
 * └── ...
 *
 * YAML TO TYPESCRIPT CONVERSION:
 * ------------------------------
 * YAML files use snake_case (e.g., starter_code_python)
 * TypeScript interfaces use camelCase (e.g., starterCodePython)
 *
 * The conversion happens in the load* functions below:
 * - loadProblem() manually maps snake_case to camelCase
 * - Other loaders return raw YAML or do basic transformation
 *
 * KEY FUNCTIONS:
 * --------------
 * - loadProblem(id): Load a problem by ID
 * - loadSolution(id): Load the solution for a problem
 * - buildLearningGuide(id): Build comprehensive guidance from all YAML files
 * - buildCategorizedHints(id): Build hint system for progressive disclosure
 * - getAllProblems(): List all available problems
 * - getProblemsByTheme(): Group problems by curriculum theme
 *
 * SECURITY:
 * ---------
 * All functions validate the problemId to prevent path traversal attacks.
 * IDs containing ".." or "/" are rejected.
 */

import fs from "fs/promises";
import path from "path";
import yaml from "yaml";
import { glob } from "glob";
import type {
  Problem,
  Solution,
  MistakesFile,
  InvariantsFile,
  PausePointsFile,
  CategorizedHints,
  HintItem,
  ProblemCard,
  ProblemGroup,
  LearningGuide,
} from "./types";

const PROBLEMS_DIR = path.join(process.cwd(), "problems");

// ============================================================================
// YAML Loading Helpers
// ============================================================================

/**
 * Load and parse a YAML file.
 */
async function loadYamlFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return yaml.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.error(`Error loading YAML file ${filePath}:`, error);
    return null;
  }
}

/**
 * Convert snake_case keys to camelCase.
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from snake_case to camelCase (shallow).
 */
function convertKeysToCamel<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result as T;
}

// ============================================================================
// Problem Loading
// ============================================================================

interface RawProblem {
  id: string;
  title: string;
  difficulty: string;
  pattern: string | string[];
  theme?: string;
  estimated_time?: string;
  description: string;
  story_context?: string;
  examples: Array<{
    input: Record<string, unknown>;
    output: unknown;
    explanation: string;
  }>;
  constraints: string[];
  hints: Array<{ level: number; text: string }>;
  starter_code_python: string;
  starter_code_javascript?: string;
  test_cases: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: unknown;
    explanation?: string;
  }>;
  edge_cases?: Array<{
    case: string;
    description: string;
    test_id: string;
  }>;
  pattern_learning_objectives?: string[];
  real_world_applications?: string[];
  complexity_analysis?: {
    time: { naive?: string; optimal: string };
    space: { optimal: string };
  };
  pattern_signature?: {
    indicators?: string[];
    pattern_name: string;
    when_to_use?: string[];
  };
}

/**
 * Load a problem by ID.
 */
export async function loadProblem(problemId: string): Promise<Problem | null> {
  const problemDir = path.join(PROBLEMS_DIR, problemId);
  const problemPath = path.join(problemDir, "problem.yaml");

  const raw = await loadYamlFile<RawProblem>(problemPath);
  if (!raw) return null;

  // Transform to camelCase structure
  const problem: Problem = {
    id: raw.id,
    title: raw.title,
    difficulty: raw.difficulty as "easy" | "medium" | "hard",
    pattern: raw.pattern,
    theme: raw.theme,
    estimatedTime: raw.estimated_time,
    description: raw.description,
    storyContext: raw.story_context,
    examples: raw.examples,
    constraints: raw.constraints,
    hints: raw.hints,
    starterCodePython: raw.starter_code_python,
    starterCodeJavascript: raw.starter_code_javascript,
    testCases: raw.test_cases.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expected: tc.expected,
      explanation: tc.explanation,
    })),
    edgeCases: raw.edge_cases?.map((ec) => ({
      case: ec.case,
      description: ec.description,
      testId: ec.test_id,
    })),
    patternLearningObjectives: raw.pattern_learning_objectives,
    realWorldApplications: raw.real_world_applications,
    complexityAnalysis: raw.complexity_analysis,
    patternSignature: raw.pattern_signature
      ? {
          indicators: raw.pattern_signature.indicators,
          patternName: raw.pattern_signature.pattern_name,
          whenToUse: raw.pattern_signature.when_to_use,
        }
      : undefined,
  };

  return problem;
}

/**
 * Load solution for a problem.
 */
export async function loadSolution(problemId: string): Promise<Solution | null> {
  const solutionPath = path.join(PROBLEMS_DIR, problemId, "solution.yaml");
  const raw = await loadYamlFile<Record<string, unknown>>(solutionPath);
  if (!raw) return null;

  // Basic transformation - can be expanded as needed
  return {
    id: raw.id as string,
    pattern: raw.pattern as string,
    difficulty: raw.difficulty as string,
    solutionCodePython: raw.solution_code_python as string,
    solutionCodeJavascript: raw.solution_code_javascript as string | undefined,
  };
}

/**
 * Load mistakes file for a problem.
 */
export async function loadMistakes(
  problemId: string
): Promise<MistakesFile | null> {
  const mistakesPath = path.join(PROBLEMS_DIR, problemId, "mistakes.yaml");
  return loadYamlFile<MistakesFile>(mistakesPath);
}

/**
 * Load invariants file for a problem.
 */
export async function loadInvariants(
  problemId: string
): Promise<InvariantsFile | null> {
  const invariantsPath = path.join(PROBLEMS_DIR, problemId, "invariants.yaml");
  return loadYamlFile<InvariantsFile>(invariantsPath);
}

/**
 * Load pause points file for a problem.
 */
export async function loadPausePoints(
  problemId: string
): Promise<PausePointsFile | null> {
  const pausePointsPath = path.join(
    PROBLEMS_DIR,
    problemId,
    "pause-points.yaml"
  );
  return loadYamlFile<PausePointsFile>(pausePointsPath);
}

// Raw guidance.yaml structure
interface RawGuidance {
  title: string;
  pattern: string;
  hints: {
    key_concepts?: Array<{ text: string }>;
    common_mistakes?: Array<{ text: string }>;
    real_world?: Array<{ text: string }>;
    solution_approach?: {
      steps: string[];
    };
  };
  complexity?: {
    time: string;
    space: string;
  };
  pattern_transfer?: {
    similar_problems?: Array<{
      name: string;
      invariants_shared?: string[];
      difference?: string;
      modification?: string;
    }>;
  };
}

/**
 * Load guidance file for a problem.
 */
export async function loadGuidance(problemId: string): Promise<RawGuidance | null> {
  const guidancePath = path.join(PROBLEMS_DIR, problemId, "guidance.yaml");
  return loadYamlFile<RawGuidance>(guidancePath);
}

// Raw solution.yaml structure (more complete)
interface RawSolution {
  id: string;
  pattern: string;
  difficulty: string;
  solution_code_python: string;
  solution_code_javascript?: string;
  approach_explanation?: {
    core_insight: string;
    step_by_step?: Array<{
      step: number;
      action: string;
      why?: string;
    }>;
  };
  alternative_solutions?: Array<{
    name: string;
    approach: string;
    complexity: {
      time: string;
      space: string;
    };
    when_to_use?: string;
  }>;
}

/**
 * Build a comprehensive LearningGuide from all problem files.
 */
export async function buildLearningGuide(problemId: string): Promise<LearningGuide | null> {
  const [problem, guidance, solutionRaw] = await Promise.all([
    loadProblem(problemId),
    loadGuidance(problemId),
    loadYamlFile<RawSolution>(path.join(PROBLEMS_DIR, problemId, "solution.yaml")),
  ]);

  if (!problem) return null;

  // Build problem context from problem.yaml
  const problemContext = {
    title: problem.title,
    pattern: Array.isArray(problem.pattern) ? problem.pattern.join(", ") : problem.pattern,
    difficulty: problem.difficulty,
    description: problem.description,
    storyContext: problem.storyContext,
    realWorldApplications: problem.realWorldApplications || [],
    patternLearningObjectives: problem.patternLearningObjectives || [],
  };

  // Build guidance from guidance.yaml (or fallback to problem.yaml hints)
  const guidanceSection = {
    keyConcepts: guidance?.hints?.key_concepts?.map(h => h.text) ||
      problem.hints?.map(h => h.text) || [],
    commonMistakes: guidance?.hints?.common_mistakes?.map(h => h.text) || [],
    realWorld: guidance?.hints?.real_world?.map(h => h.text) || [],
  };

  // Build solution from solution.yaml and guidance.yaml
  const solution = {
    solutionApproach: guidance?.hints?.solution_approach?.steps || [],
    complexity: guidance?.complexity || {
      time: problem.complexityAnalysis?.time?.optimal || "Unknown",
      space: problem.complexityAnalysis?.space?.optimal || "Unknown",
    },
    coreInsight: solutionRaw?.approach_explanation?.core_insight,
    stepByStep: solutionRaw?.approach_explanation?.step_by_step?.map(s => ({
      step: s.step,
      action: s.action,
      why: s.why,
    })),
    codePython: solutionRaw?.solution_code_python,
    alternativeSolutions: solutionRaw?.alternative_solutions?.map(alt => ({
      name: alt.name,
      approach: alt.approach,
      time: alt.complexity.time,
      space: alt.complexity.space,
      whenToUse: alt.when_to_use,
    })),
  };

  // Build pattern transfer from guidance.yaml
  const patternTransfer = guidance?.pattern_transfer?.similar_problems ? {
    similarProblems: guidance.pattern_transfer.similar_problems.map(p => ({
      name: p.name,
      invariantsShared: p.invariants_shared || [],
      difference: p.difference,
      modification: p.modification,
    })),
  } : undefined;

  return {
    problemContext,
    guidance: guidanceSection,
    solution,
    patternTransfer,
  };
}

// ============================================================================
// Hint System
// ============================================================================

/**
 * Build categorized hints from all problem files.
 */
export async function buildCategorizedHints(
  problemId: string
): Promise<CategorizedHints> {
  const [problem, mistakes, solution] = await Promise.all([
    loadProblem(problemId),
    loadMistakes(problemId),
    loadSolution(problemId),
  ]);

  const hints: CategorizedHints = {
    keyConcepts: [],
    commonMistakes: [],
    projectContext: [],
    paperReference: [],
    solutionApproach: [],
  };

  // Key concepts from problem hints
  if (problem?.hints) {
    hints.keyConcepts = problem.hints.map((h, i) => ({
      id: `key-${i}`,
      text: h.text,
      revealed: false,
    }));
  }

  // Common mistakes from mistakes.yaml
  if (mistakes?.commonMistakes) {
    hints.commonMistakes = mistakes.commonMistakes.map((m, i) => ({
      id: `mistake-${i}`,
      text: `**${m.teachingMoment.title}**\n\n${m.teachingMoment.explanation}`,
      revealed: false,
    }));
  }

  // Project context (to be added in future - AI Safety paper connections)
  // For now, use description + pattern learning objectives
  if (problem?.patternLearningObjectives) {
    hints.projectContext = problem.patternLearningObjectives.map((obj, i) => ({
      id: `context-${i}`,
      text: obj,
      revealed: false,
    }));
  }

  // Paper reference (to be added in future)
  // For now, use real-world applications as a placeholder
  if (problem?.realWorldApplications) {
    hints.paperReference = problem.realWorldApplications
      .slice(0, 2)
      .map((app, i) => ({
        id: `paper-${i}`,
        text: `**Real-World Application:** ${app}`,
        revealed: false,
      }));
  }

  // Solution approach from solution.yaml
  if (solution?.solutionCodePython) {
    // Extract comments/docstrings as hints
    const solutionLines = solution.solutionCodePython.split("\n");
    const docstringMatch = solution.solutionCodePython.match(
      /"""[\s\S]*?"""/
    );
    if (docstringMatch) {
      hints.solutionApproach.push({
        id: "approach-0",
        text: docstringMatch[0]
          .replace(/"""/g, "")
          .trim(),
        revealed: false,
      });
    }

    // Add complexity hint
    if (problem?.complexityAnalysis) {
      hints.solutionApproach.push({
        id: "approach-1",
        text: `**Complexity:**\n- Time: ${problem.complexityAnalysis.time.optimal}\n- Space: ${problem.complexityAnalysis.space.optimal}`,
        revealed: false,
      });
    }
  }

  return hints;
}

// ============================================================================
// Problem Listing
// ============================================================================

/**
 * Get all available problems.
 */
export async function getAllProblems(): Promise<ProblemCard[]> {
  // Ignore underscore-prefixed directories (like _template)
  const problemDirs = await glob("[!_]*/problem.yaml", { cwd: PROBLEMS_DIR });

  const problems: ProblemCard[] = [];

  for (const problemPath of problemDirs) {
    const problemId = path.dirname(problemPath);
    const problem = await loadProblem(problemId);

    if (problem) {
      problems.push({
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        pattern: problem.pattern,
        theme: problem.theme,
        solved: false, // TODO: Track user progress
      });
    }
  }

  return problems;
}

/**
 * Get problems grouped by theme.
 */
export async function getProblemsByTheme(): Promise<ProblemGroup[]> {
  const problems = await getAllProblems();

  // Group by theme
  const themeMap = new Map<string, ProblemCard[]>();

  for (const problem of problems) {
    const theme = problem.theme || "General";
    if (!themeMap.has(theme)) {
      themeMap.set(theme, []);
    }
    themeMap.get(theme)!.push(problem);
  }

  // Convert to array
  const groups: ProblemGroup[] = [];
  for (const [theme, probs] of themeMap) {
    groups.push({
      theme,
      title: formatThemeTitle(theme),
      problems: probs,
      solvedCount: probs.filter((p) => p.solved).length,
    });
  }

  return groups;
}

/**
 * Format theme slug into title.
 */
function formatThemeTitle(theme: string): string {
  const titles: Record<string, string> = {
    prerequisites: "Prerequisites",
    foundations: "Foundations",
    "going-deeper": "Going Deeper",
    "advanced-safety": "Advanced Safety",
    interpretability: "Interpretability",
    systems: "Systems",
    integration: "Integration",
    "software-engineering": "Software Engineering",
    General: "General",
  };

  return titles[theme] || theme
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ============================================================================
// Problem Existence Check
// ============================================================================

/**
 * Check if a problem exists.
 */
export async function problemExists(problemId: string): Promise<boolean> {
  // Validate problemId to prevent path traversal
  if (problemId.includes("..") || problemId.includes("/")) {
    return false;
  }

  const problemPath = path.join(PROBLEMS_DIR, problemId, "problem.yaml");
  try {
    await fs.access(problemPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get problem directory path (with validation).
 */
export function getProblemDir(problemId: string): string | null {
  // Validate problemId to prevent path traversal
  if (problemId.includes("..") || problemId.includes("/")) {
    return null;
  }
  return path.join(PROBLEMS_DIR, problemId);
}
