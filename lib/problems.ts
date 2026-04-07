/**
 * =============================================================================
 * CORTEX LATTICE - PROBLEM LOADING UTILITIES
 * =============================================================================
 *
 * Server-side utilities for loading problem definitions from YAML files.
 * Supports themed content from both public (problems/) and private (content/)
 * directories.
 *
 * PROBLEM DIRECTORY STRUCTURE (new, themed):
 * ------------------------------------------
 * problems/
 * ├── _template/
 * ├── two-pointers-pair-distance/
 * │   ├── core.yaml              # Algorithm-level: pattern, test data, constraints
 * │   ├── invariants.yaml        # Algorithm correctness (not themed)
 * │   └── themes/
 * │       └── coding-interview/  # Free theme (public repo)
 * │           ├── problem.yaml   # Themed title, description, hints, starter code
 * │           ├── guidance.yaml
 * │           ├── solution.yaml
 * │           └── mistakes.yaml
 *
 * content/                        # Git submodule (private repo, optional)
 * └── themes/
 *     └── two-pointers-pair-distance/
 *         └── dungeon-crawler/    # Premium theme
 *             ├── problem.yaml
 *             └── ...
 *
 * LEGACY SUPPORT:
 * ---------------
 * Problems with problem.yaml at the root (no core.yaml) still load as before.
 *
 * KEY FUNCTIONS:
 * --------------
 * - loadProblem(id, themeId?): Load a problem (core + theme overlay)
 * - loadSolution(id, themeId?): Load the solution for a problem
 * - buildLearningGuide(id, themeId?): Build comprehensive guidance
 * - buildCategorizedHints(id, themeId?): Build hint system
 * - getAllProblems(): List all available problems
 * - getProblemsByCategory(): Group problems by curriculum category
 * - getAvailableThemes(id): List available themes for a problem
 */

import fs from "fs/promises";
import path from "path";
import yaml from "yaml";
import { glob } from "glob";
import type {
  Problem,
  CoreProblem,
  ThemeInfo,
  Solution,
  MistakesFile,
  InvariantsFile,
  PausePointsFile,
  CategorizedHints,
  HintItem,
  ProblemCard,
  ProblemGroup,
  ThemedProblemCard,
  PatternGroup,
  AlgorithmGroup,
  AlgorithmSummary,
  ThemeSummary,
  LearningGuide,
} from "./types";

const PROBLEMS_DIR = path.join(process.cwd(), "problems");
const CONTENT_DIR = path.join(process.cwd(), "content");
const DEFAULT_THEME = "coding-interview";

// ============================================================================
// File Loading Helpers
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
 * Check if a file or directory exists.
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// Cached check for content directory existence
let _contentDirExists: boolean | null = null;

async function contentDirExists(): Promise<boolean> {
  if (_contentDirExists === null) {
    _contentDirExists = await pathExists(path.join(CONTENT_DIR, "themes"));
  }
  return _contentDirExists;
}

// ============================================================================
// Theme Resolution
// ============================================================================

/**
 * Resolve the filesystem path for a theme's files.
 * Checks public themes first, then private (content/) themes.
 */
export async function resolveThemePath(
  problemId: string,
  themeId: string
): Promise<string | null> {
  // Check public themes: problems/<id>/themes/<theme>/
  const publicPath = path.join(PROBLEMS_DIR, problemId, "themes", themeId);
  if (await pathExists(publicPath)) {
    return publicPath;
  }

  // Check private themes: content/themes/<id>/<theme>/
  if (await contentDirExists()) {
    const privatePath = path.join(CONTENT_DIR, "themes", problemId, themeId);
    if (await pathExists(privatePath)) {
      return privatePath;
    }
  }

  return null;
}

/**
 * Get all available themes for a problem.
 */
export async function getAvailableThemes(
  problemId: string
): Promise<ThemeInfo[]> {
  const themes: ThemeInfo[] = [];

  // Scan public themes
  const publicThemesDir = path.join(PROBLEMS_DIR, problemId, "themes");
  if (await pathExists(publicThemesDir)) {
    try {
      const entries = await fs.readdir(publicThemesDir, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith("_")) {
          themes.push({
            themeId: entry.name,
            displayName: formatThemeName(entry.name),
            source: "public",
          });
        }
      }
    } catch {
      // Directory read failed, skip
    }
  }

  // Scan private themes
  if (await contentDirExists()) {
    const privateThemesDir = path.join(CONTENT_DIR, "themes", problemId);
    if (await pathExists(privateThemesDir)) {
      try {
        const entries = await fs.readdir(privateThemesDir, {
          withFileTypes: true,
        });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith("_")) {
            // Don't duplicate if already found in public
            if (!themes.some((t) => t.themeId === entry.name)) {
              themes.push({
                themeId: entry.name,
                displayName: formatThemeName(entry.name),
                source: "private",
              });
            }
          }
        }
      } catch {
        // Directory read failed, skip
      }
    }
  }

  return themes;
}

/**
 * Format a theme slug into a display name.
 */
function formatThemeName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ============================================================================
// Core Problem Loading
// ============================================================================

interface RawCoreProblem {
  id: string;
  pattern: string | string[];
  difficulty: string;
  category?: string;
  estimated_time?: string;
  constraints: string[];
  test_case_data: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: unknown;
  }>;
  edge_cases?: Array<{
    case: string;
    description: string;
    test_id: string;
  }>;
  complexity_analysis?: {
    time: { naive?: string; optimal: string };
    space: { optimal: string };
  };
  pattern_signature?: {
    indicators?: string[];
    pattern_name: string;
    when_to_use?: string[];
  };
  pattern_learning_objectives?: string[];
  real_world_applications?: string[];
}

/**
 * Load the core (algorithm-invariant) definition for a problem.
 */
async function loadCore(problemId: string): Promise<RawCoreProblem | null> {
  const corePath = path.join(PROBLEMS_DIR, problemId, "core.yaml");
  return loadYamlFile<RawCoreProblem>(corePath);
}

// ============================================================================
// Themed Problem Loading (new format)
// ============================================================================

interface RawThemedProblem {
  title: string;
  description: string;
  story_context?: string;
  function_name?: string;
  examples: Array<{
    input: Record<string, unknown>;
    output: unknown;
    explanation: string;
  }>;
  hints: Array<{ level: number; text: string }>;
  starter_code_python: string;
  starter_code_javascript?: string;
  test_case_explanations?: Record<string, string>;
  real_world_applications?: string[];
}

// ============================================================================
// Legacy Problem Loading (old format, no core.yaml)
// ============================================================================

interface RawLegacyProblem {
  id: string;
  title: string;
  difficulty: string;
  pattern: string | string[];
  theme?: string;
  category?: string;
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

// ============================================================================
// Problem Loading (unified)
// ============================================================================

/**
 * Load a problem by ID, optionally with a specific theme.
 * Supports both new format (core.yaml + themes/) and legacy format (problem.yaml at root).
 */
export async function loadProblem(
  problemId: string,
  themeId?: string
): Promise<Problem | null> {
  const core = await loadCore(problemId);

  if (core) {
    // New format: merge core + theme
    return loadThemedProblem(problemId, core, themeId || DEFAULT_THEME);
  }

  // Legacy format: load problem.yaml from root
  return loadLegacyProblem(problemId);
}

/**
 * Load a problem using the new core + theme format.
 */
async function loadThemedProblem(
  problemId: string,
  core: RawCoreProblem,
  themeId: string
): Promise<Problem | null> {
  const themePath = await resolveThemePath(problemId, themeId);
  if (!themePath) {
    // Requested theme not found, try default
    if (themeId !== DEFAULT_THEME) {
      const defaultPath = await resolveThemePath(problemId, DEFAULT_THEME);
      if (defaultPath) {
        return loadThemedProblem(problemId, core, DEFAULT_THEME);
      }
    }
    // No default theme either — fall back to the first available theme
    const available = await getAvailableThemes(problemId);
    if (available.length > 0) {
      return loadThemedProblem(problemId, core, available[0].themeId);
    }
    return null;
  }

  const themed = await loadYamlFile<RawThemedProblem>(
    path.join(themePath, "problem.yaml")
  );
  if (!themed) return null;

  const availableThemes = await getAvailableThemes(problemId);

  // Merge test case data from core with explanations from theme
  const testCases = core.test_case_data.map((tc) => ({
    id: tc.id,
    input: tc.input,
    expected: tc.expected,
    explanation: themed.test_case_explanations?.[tc.id],
  }));

  return {
    id: core.id,
    title: themed.title,
    difficulty: core.difficulty as "easy" | "medium" | "hard",
    pattern: core.pattern,
    category: core.category,
    themeId,
    availableThemes,
    estimatedTime: core.estimated_time,
    description: themed.description,
    storyContext: themed.story_context,
    examples: themed.examples,
    constraints: core.constraints,
    hints: themed.hints,
    starterCodePython: themed.starter_code_python,
    starterCodeJavascript: themed.starter_code_javascript,
    functionName: themed.function_name,
    testCases,
    edgeCases: core.edge_cases?.map((ec) => ({
      case: ec.case,
      description: ec.description,
      testId: ec.test_id,
    })),
    patternLearningObjectives: core.pattern_learning_objectives,
    realWorldApplications:
      themed.real_world_applications || core.real_world_applications,
    complexityAnalysis: core.complexity_analysis,
    patternSignature: core.pattern_signature
      ? {
          indicators: core.pattern_signature.indicators,
          patternName: core.pattern_signature.pattern_name,
          whenToUse: core.pattern_signature.when_to_use,
        }
      : undefined,
  };
}

/**
 * Load a problem using the legacy format (problem.yaml at root, no core.yaml).
 */
async function loadLegacyProblem(problemId: string): Promise<Problem | null> {
  const problemPath = path.join(PROBLEMS_DIR, problemId, "problem.yaml");
  const raw = await loadYamlFile<RawLegacyProblem>(problemPath);
  if (!raw) return null;

  return {
    id: raw.id,
    title: raw.title,
    difficulty: raw.difficulty as "easy" | "medium" | "hard",
    pattern: raw.pattern,
    category: raw.category || raw.theme,
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
}

// ============================================================================
// Solution Loading
// ============================================================================

/**
 * Resolve a themed file path. Checks theme dir first, then problem root.
 */
async function resolveThemedFile(
  problemId: string,
  fileName: string,
  themeId?: string
): Promise<string | null> {
  if (themeId) {
    const themePath = await resolveThemePath(problemId, themeId);
    if (themePath) {
      const themedFile = path.join(themePath, fileName);
      if (await pathExists(themedFile)) {
        return themedFile;
      }
    }
  }

  // Fall back to problem root
  const rootFile = path.join(PROBLEMS_DIR, problemId, fileName);
  if (await pathExists(rootFile)) {
    return rootFile;
  }

  return null;
}

/**
 * Load solution for a problem.
 */
export async function loadSolution(
  problemId: string,
  themeId?: string
): Promise<Solution | null> {
  const filePath = await resolveThemedFile(
    problemId,
    "solution.yaml",
    themeId
  );
  if (!filePath) return null;

  const raw = await loadYamlFile<Record<string, unknown>>(filePath);
  if (!raw) return null;

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
  problemId: string,
  themeId?: string
): Promise<MistakesFile | null> {
  const filePath = await resolveThemedFile(
    problemId,
    "mistakes.yaml",
    themeId
  );
  if (!filePath) return null;
  return loadYamlFile<MistakesFile>(filePath);
}

/**
 * Load invariants file for a problem (always from problem root, not themed).
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
  problemId: string,
  themeId?: string
): Promise<PausePointsFile | null> {
  const filePath = await resolveThemedFile(
    problemId,
    "pause-points.yaml",
    themeId
  );
  if (!filePath) return null;
  return loadYamlFile<PausePointsFile>(filePath);
}

// ============================================================================
// Guidance Loading
// ============================================================================

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
export async function loadGuidance(
  problemId: string,
  themeId?: string
): Promise<RawGuidance | null> {
  const filePath = await resolveThemedFile(
    problemId,
    "guidance.yaml",
    themeId
  );
  if (!filePath) return null;
  return loadYamlFile<RawGuidance>(filePath);
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
export async function buildLearningGuide(
  problemId: string,
  themeId?: string
): Promise<LearningGuide | null> {
  // Load the problem first to resolve the actual theme being used
  const problem = await loadProblem(problemId, themeId);
  if (!problem) return null;

  // Use the resolved theme (loadProblem may have fallen back to an available theme)
  const resolvedTheme = problem.themeId || themeId;

  const solutionFilePath = await resolveThemedFile(
    problemId,
    "solution.yaml",
    resolvedTheme
  );

  const [guidance, solutionRaw] = await Promise.all([
    loadGuidance(problemId, resolvedTheme),
    solutionFilePath
      ? loadYamlFile<RawSolution>(solutionFilePath)
      : Promise.resolve(null),
  ]);

  const problemContext = {
    title: problem.title,
    pattern: Array.isArray(problem.pattern)
      ? problem.pattern.join(", ")
      : problem.pattern,
    difficulty: problem.difficulty,
    description: problem.description,
    storyContext: problem.storyContext,
    realWorldApplications: problem.realWorldApplications || [],
    patternLearningObjectives: problem.patternLearningObjectives || [],
  };

  const guidanceSection = {
    keyConcepts:
      guidance?.hints?.key_concepts?.map((h) => h.text) ||
      problem.hints?.map((h) => h.text) ||
      [],
    commonMistakes:
      guidance?.hints?.common_mistakes?.map((h) => h.text) || [],
    realWorld: guidance?.hints?.real_world?.map((h) => h.text) || [],
  };

  const solution = {
    solutionApproach: guidance?.hints?.solution_approach?.steps || [],
    complexity: guidance?.complexity || {
      time: problem.complexityAnalysis?.time?.optimal || "Unknown",
      space: problem.complexityAnalysis?.space?.optimal || "Unknown",
    },
    coreInsight: solutionRaw?.approach_explanation?.core_insight,
    stepByStep: solutionRaw?.approach_explanation?.step_by_step?.map((s) => ({
      step: s.step,
      action: s.action,
      why: s.why,
    })),
    codePython: solutionRaw?.solution_code_python,
    alternativeSolutions: solutionRaw?.alternative_solutions?.map((alt) => ({
      name: alt.name,
      approach: alt.approach,
      time: alt.complexity.time,
      space: alt.complexity.space,
      whenToUse: alt.when_to_use,
    })),
  };

  const patternTransfer = guidance?.pattern_transfer?.similar_problems
    ? {
        similarProblems: guidance.pattern_transfer.similar_problems.map(
          (p) => ({
            name: p.name,
            invariantsShared: p.invariants_shared || [],
            difference: p.difference,
            modification: p.modification,
          })
        ),
      }
    : undefined;

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
  problemId: string,
  themeId?: string
): Promise<CategorizedHints> {
  // Load problem first to resolve actual theme
  const problem = await loadProblem(problemId, themeId);
  const resolvedTheme = problem?.themeId || themeId;

  const [mistakes, solution] = await Promise.all([
    loadMistakes(problemId, resolvedTheme),
    loadSolution(problemId, resolvedTheme),
  ]);

  const hints: CategorizedHints = {
    keyConcepts: [],
    commonMistakes: [],
    projectContext: [],
    paperReference: [],
    solutionApproach: [],
  };

  if (problem?.hints) {
    hints.keyConcepts = problem.hints.map((h, i) => ({
      id: `key-${i}`,
      text: h.text,
      revealed: false,
    }));
  }

  if (mistakes?.commonMistakes) {
    hints.commonMistakes = mistakes.commonMistakes.map((m, i) => ({
      id: `mistake-${i}`,
      text: `**${m.teachingMoment.title}**\n\n${m.teachingMoment.explanation}`,
      revealed: false,
    }));
  }

  if (problem?.patternLearningObjectives) {
    hints.projectContext = problem.patternLearningObjectives.map((obj, i) => ({
      id: `context-${i}`,
      text: obj,
      revealed: false,
    }));
  }

  if (problem?.realWorldApplications) {
    hints.paperReference = problem.realWorldApplications
      .slice(0, 2)
      .map((app, i) => ({
        id: `paper-${i}`,
        text: `**Real-World Application:** ${app}`,
        revealed: false,
      }));
  }

  if (solution?.solutionCodePython) {
    const docstringMatch = solution.solutionCodePython.match(
      /"""[\s\S]*?"""/
    );
    if (docstringMatch) {
      hints.solutionApproach.push({
        id: "approach-0",
        text: docstringMatch[0].replace(/"""/g, "").trim(),
        revealed: false,
      });
    }

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
 * Supports both new format (core.yaml) and legacy format (problem.yaml at root).
 */
export async function getAllProblems(): Promise<ProblemCard[]> {
  // Find both new-format and legacy-format problems
  const [newFormatDirs, legacyDirs] = await Promise.all([
    glob("[!_]*/core.yaml", { cwd: PROBLEMS_DIR }),
    glob("[!_]*/problem.yaml", { cwd: PROBLEMS_DIR }),
  ]);

  const newFormatIds = new Set(newFormatDirs.map((p) => path.dirname(p)));
  const problems: ProblemCard[] = [];

  // Load new-format problems (core.yaml + default theme)
  for (const problemId of newFormatIds) {
    const problem = await loadProblem(problemId);
    if (problem) {
      problems.push({
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        pattern: problem.pattern,
        category: problem.category,
        availableThemes: problem.availableThemes,
        solved: false,
      });
    }
  }

  // Load legacy-format problems (skip if already loaded as new format)
  for (const problemPath of legacyDirs) {
    const problemId = path.dirname(problemPath);
    if (newFormatIds.has(problemId)) continue;

    const problem = await loadProblem(problemId);
    if (problem) {
      problems.push({
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        pattern: problem.pattern,
        category: problem.category,
        solved: false,
      });
    }
  }

  return problems;
}

/**
 * Get problems grouped by category.
 */
export async function getProblemsByCategory(): Promise<ProblemGroup[]> {
  const problems = await getAllProblems();

  const categoryMap = new Map<string, ProblemCard[]>();

  for (const problem of problems) {
    const category = problem.category || "General";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(problem);
  }

  const groups: ProblemGroup[] = [];
  for (const [category, probs] of categoryMap) {
    groups.push({
      category,
      title: formatCategoryTitle(category),
      problems: probs,
      solvedCount: probs.filter((p) => p.solved).length,
    });
  }

  return groups;
}

/**
 * Get all themed problem variants grouped by pattern, then by algorithm.
 * Expands each algorithm into one entry per available theme.
 */
export async function getProblemsByPattern(): Promise<PatternGroup[]> {
  const [newFormatDirs, legacyDirs] = await Promise.all([
    glob("[!_]*/core.yaml", { cwd: PROBLEMS_DIR }),
    glob("[!_]*/problem.yaml", { cwd: PROBLEMS_DIR }),
  ]);

  const newFormatIds = new Set(newFormatDirs.map((p) => path.dirname(p)));
  const patternMap = new Map<string, AlgorithmGroup[]>();

  // New-format problems: expand into themed variants
  for (const problemId of newFormatIds) {
    const core = await loadCore(problemId);
    if (!core) continue;

    const themes = await getAvailableThemes(problemId);
    const pattern = Array.isArray(core.pattern) ? core.pattern[0] : core.pattern;
    const algorithmName = formatAlgorithmName(problemId, pattern);

    const variants: ThemedProblemCard[] = [];

    for (const theme of themes) {
      const problem = await loadProblem(problemId, theme.themeId);
      if (!problem) continue;

      variants.push({
        id: problemId,
        themeId: theme.themeId,
        themeName: theme.displayName,
        title: problem.title,
        difficulty: core.difficulty as "easy" | "medium" | "hard",
        pattern: core.pattern,
        category: core.category,
        algorithmName,
        solved: false,
      });
    }

    if (variants.length === 0) continue;

    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, []);
    }
    patternMap.get(pattern)!.push({
      algorithmId: problemId,
      algorithmName,
      difficulty: core.difficulty as "easy" | "medium" | "hard",
      themeCount: themes.length,
      variants,
    });
  }

  const groups: PatternGroup[] = [];
  for (const [pattern, algorithms] of patternMap) {
    groups.push({
      pattern,
      title: formatThemeName(pattern),
      algorithms,
    });
  }

  return groups;
}

// ============================================================================
// Algorithm Summary (for theme picker page)
// ============================================================================

/**
 * Load a lightweight summary for the theme picker page.
 * Loads core metadata + each theme's title and story preview.
 */
export async function loadAlgorithmSummary(
  problemId: string
): Promise<AlgorithmSummary | null> {
  const core = await loadCore(problemId);
  if (!core) return null;

  const pattern = Array.isArray(core.pattern) ? core.pattern[0] : core.pattern;
  const algorithmName = formatAlgorithmName(problemId, pattern);
  const availableThemes = await getAvailableThemes(problemId);

  const themes: ThemeSummary[] = [];

  for (const theme of availableThemes) {
    const themePath = await resolveThemePath(problemId, theme.themeId);
    if (!themePath) continue;

    const themed = await loadYamlFile<{
      title: string;
      story_context?: string;
    }>(path.join(themePath, "problem.yaml"));
    if (!themed) continue;

    const storyPreview = themed.story_context
      ? themed.story_context.slice(0, 150) +
        (themed.story_context.length > 150 ? "..." : "")
      : undefined;

    themes.push({
      themeId: theme.themeId,
      displayName: theme.displayName,
      title: themed.title,
      storyPreview,
      source: theme.source,
      solved: false,
    });
  }

  if (themes.length === 0) return null;

  return {
    id: core.id,
    algorithmName,
    pattern: core.pattern,
    difficulty: core.difficulty as "easy" | "medium" | "hard",
    category: core.category,
    estimatedTime: core.estimated_time,
    themes,
  };
}

/**
 * Derive a human-readable algorithm name from problem ID.
 * e.g. "two-pointers-pair-with-target-sum" → "Pair with Target Sum"
 */
function formatAlgorithmName(problemId: string, pattern: string): string {
  // Strip the pattern prefix from the problem ID
  const patternPrefix = pattern + "-";
  const suffix = problemId.startsWith(patternPrefix)
    ? problemId.slice(patternPrefix.length)
    : problemId;

  return suffix
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Format category slug into title.
 */
function formatCategoryTitle(category: string): string {
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

  return (
    titles[category] ||
    category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

// ============================================================================
// Problem Existence Check
// ============================================================================

/**
 * Check if a problem exists (new or legacy format).
 */
export async function problemExists(problemId: string): Promise<boolean> {
  if (problemId.includes("..") || problemId.includes("/")) {
    return false;
  }

  const coreExists = await pathExists(
    path.join(PROBLEMS_DIR, problemId, "core.yaml")
  );
  if (coreExists) return true;

  const legacyExists = await pathExists(
    path.join(PROBLEMS_DIR, problemId, "problem.yaml")
  );
  return legacyExists;
}

/**
 * Get problem directory path (with validation).
 */
export function getProblemDir(problemId: string): string | null {
  if (problemId.includes("..") || problemId.includes("/")) {
    return null;
  }
  return path.join(PROBLEMS_DIR, problemId);
}

/**
 * Build a merged problem.yaml for the Docker executor.
 * Combines core test data with themed starter code so the test runner
 * sees the same schema it always has.
 */
export async function buildMergedProblemYaml(
  problemId: string,
  themeId?: string
): Promise<string | null> {
  const core = await loadCore(problemId);
  if (!core) return null;

  const effectiveTheme = themeId || DEFAULT_THEME;
  const themePath = await resolveThemePath(problemId, effectiveTheme);
  if (!themePath) return null;

  const themed = await loadYamlFile<RawThemedProblem>(
    path.join(themePath, "problem.yaml")
  );
  if (!themed) return null;

  // Build a merged object in the legacy schema the test runner expects
  const merged = {
    id: core.id,
    title: themed.title,
    difficulty: core.difficulty,
    pattern: core.pattern,
    description: themed.description,
    constraints: core.constraints,
    starter_code_python: themed.starter_code_python,
    starter_code_javascript: themed.starter_code_javascript,
    test_cases: core.test_case_data.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expected: tc.expected,
      explanation: themed.test_case_explanations?.[tc.id],
    })),
  };

  return yaml.stringify(merged);
}
