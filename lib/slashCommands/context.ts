/**
 * Context Capture Utilities
 *
 * Captures editor context when a slash command is executed.
 */

import type { ContributionContext, ExecutionResult } from "@/lib/types";

/**
 * Capture the current editor context.
 */
export function captureEditorContext(params: {
  code: string;
  cursorLine: number;
  cursorColumn: number;
  selectedText?: string;
  language?: "python" | "javascript";
  testResults?: ExecutionResult;
  revealedHints?: string[];
}): ContributionContext {
  return {
    code: params.code,
    cursorLine: params.cursorLine,
    cursorColumn: params.cursorColumn,
    selectedText: params.selectedText,
    language: params.language ?? "python",
    testResults: params.testResults,
    revealedHints: params.revealedHints,
  };
}

/**
 * Extract a code snippet around the cursor position.
 * Useful for providing context in contributions.
 */
export function extractCodeSnippet(
  code: string,
  cursorLine: number,
  contextLines: number = 3
): string {
  const lines = code.split("\n");
  const startLine = Math.max(0, cursorLine - contextLines);
  const endLine = Math.min(lines.length, cursorLine + contextLines + 1);

  return lines.slice(startLine, endLine).join("\n");
}

/**
 * Detect if the user is likely stuck based on context.
 * Returns a confidence score from 0 to 1.
 */
export function detectStuckScore(params: {
  timeSinceStart: number; // milliseconds
  testResults?: ExecutionResult;
  codeChangeCount?: number;
}): number {
  let score = 0;

  // Time factor: longer time suggests being stuck
  const minutesSpent = params.timeSinceStart / (1000 * 60);
  if (minutesSpent > 30) score += 0.4;
  else if (minutesSpent > 15) score += 0.2;
  else if (minutesSpent > 5) score += 0.1;

  // Failed tests suggest being stuck
  if (params.testResults) {
    const { passed, total } = params.testResults;
    if (total > 0) {
      const passRate = passed / total;
      if (passRate === 0) score += 0.3;
      else if (passRate < 0.5) score += 0.2;
    }
  }

  // Many code changes might suggest trial and error
  if (params.codeChangeCount !== undefined && params.codeChangeCount > 20) {
    score += 0.2;
  }

  return Math.min(1, score);
}

/**
 * Calculate time since session start in milliseconds.
 */
export function calculateTimeSinceStart(sessionStartTime: number): number {
  return Date.now() - sessionStartTime;
}

/**
 * Format time duration for display.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
