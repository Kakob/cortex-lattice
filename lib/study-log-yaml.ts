/**
 * Study Log YAML Parser
 *
 * Parses the dsa-study-log.yaml file and returns structured data.
 */

import fs from "fs/promises";
import path from "path";
import yaml from "yaml";

const STUDY_LOG_PATH = path.join(process.cwd(), "problems", "dsa-study-log.yaml");

export interface StudyProblem {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  first_attempt: string;
  bugs: string[];
  peeked_at: string[];
  key_insight: string;
  can_solve_cold: boolean;
}

export interface PatternData {
  when_to_use: string;
  template: string;
  problems: StudyProblem[];
}

export interface StudyLogData {
  patterns: Record<string, PatternData>;
  progress: {
    total_problems: number;
    solved_once: number;
    can_solve_cold: number;
    last_updated: string;
  };
}

export interface StudyPatternGroup {
  pattern: string;
  title: string;
  whenToUse: string;
  template: string;
  problems: StudyProblem[];
  stats: {
    total: number;
    withInsight: number;
    canSolveCold: number;
  };
}

/**
 * Format pattern slug into title.
 */
function formatPatternTitle(pattern: string): string {
  return pattern
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Load and parse the study log YAML file.
 */
export async function loadStudyLog(): Promise<StudyLogData | null> {
  try {
    const content = await fs.readFile(STUDY_LOG_PATH, "utf-8");
    return yaml.parse(content) as StudyLogData;
  } catch (error) {
    console.error("Error loading study log YAML:", error);
    return null;
  }
}

/**
 * Get study problems grouped by pattern.
 */
export async function getStudyProblemsByPattern(): Promise<StudyPatternGroup[]> {
  const data = await loadStudyLog();
  if (!data) return [];

  const groups: StudyPatternGroup[] = [];

  for (const [pattern, patternData] of Object.entries(data.patterns)) {
    const problems = patternData.problems || [];

    groups.push({
      pattern,
      title: formatPatternTitle(pattern),
      whenToUse: patternData.when_to_use,
      template: patternData.template,
      problems,
      stats: {
        total: problems.length,
        withInsight: problems.filter((p) => p.key_insight && p.key_insight.trim() !== "").length,
        canSolveCold: problems.filter((p) => p.can_solve_cold).length,
      },
    });
  }

  return groups;
}

/**
 * Get overall progress stats.
 */
export async function getStudyProgress(): Promise<{
  totalProblems: number;
  withInsight: number;
  canSolveCold: number;
  patterns: number;
}> {
  const groups = await getStudyProblemsByPattern();

  let totalProblems = 0;
  let withInsight = 0;
  let canSolveCold = 0;

  for (const group of groups) {
    totalProblems += group.stats.total;
    withInsight += group.stats.withInsight;
    canSolveCold += group.stats.canSolveCold;
  }

  return {
    totalProblems,
    withInsight,
    canSolveCold,
    patterns: groups.length,
  };
}
