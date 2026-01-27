/**
 * Cortex Lattice - Client API Functions
 *
 * Functions for calling the API from React components.
 */

import type { ExecutionRequest, ExecutionResult } from "./types";

const API_BASE = "/api";

/**
 * Execute code against a problem's test cases.
 */
export async function executeCode(
  request: ExecutionRequest
): Promise<ExecutionResult> {
  const response = await fetch(`${API_BASE}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return {
      success: false,
      total: 0,
      passed: 0,
      failed: 0,
      results: [],
      error: error.error || `HTTP error ${response.status}`,
    };
  }

  return response.json();
}

/**
 * Type-safe problem fetching (for client components).
 */
export async function fetchProblem(problemId: string) {
  const response = await fetch(`${API_BASE}/problems/${problemId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch problem: ${response.status}`);
  }
  return response.json();
}
