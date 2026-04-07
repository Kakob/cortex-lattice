/**
 * Cortex Lattice - Code Execution API
 *
 * POST /api/execute
 *
 * Executes user code against problem test cases via Modal sandbox.
 * Falls back to local Docker execution if MODAL_ENDPOINT_URL is not set.
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { problemExists, getProblemDir, buildMergedProblemYaml } from "@/lib/problems";
import type { ExecutionRequest, ExecutionResult } from "@/lib/types";

const execAsync = promisify(exec);

// Configuration
const MODAL_ENDPOINT_URL = process.env.MODAL_ENDPOINT_URL; // e.g. https://your-workspace--cortex-lattice-executor-execute.modal.run
const MODAL_TOKEN_ID = process.env.MODAL_TOKEN_ID;
const MODAL_TOKEN_SECRET = process.env.MODAL_TOKEN_SECRET;

// Docker fallback config (local development)
const DOCKER_PATH = process.env.DOCKER_PATH || "/usr/local/bin/docker";
const DOCKER_IMAGE = process.env.DOCKER_IMAGE || "cortex-executor:latest";
const EXECUTION_TIMEOUT = parseInt(
  process.env.EXECUTION_TIMEOUT || "30000",
  10
);
const MAX_MEMORY = process.env.MAX_MEMORY || "512m";
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || "3", 10);

// Simple semaphore for limiting concurrent executions (Docker fallback only)
let currentExecutions = 0;
const executionQueue: Array<() => void> = [];

async function acquireLock(): Promise<void> {
  if (currentExecutions < MAX_CONCURRENT) {
    currentExecutions++;
    return;
  }

  return new Promise((resolve) => {
    executionQueue.push(() => {
      currentExecutions++;
      resolve();
    });
  });
}

function releaseLock(): void {
  currentExecutions--;
  const next = executionQueue.shift();
  if (next) {
    next();
  }
}

/**
 * Validate problem ID to prevent path traversal attacks.
 */
function isValidProblemId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length < 100;
}

/**
 * Create a temporary directory for code execution.
 */
async function createTempDir(): Promise<string> {
  const tempBase = path.join(process.cwd(), ".tmp");
  const tempDir = path.join(tempBase, `exec-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Clean up temporary directory.
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    await execAsync(`rm -rf "${tempDir}"`);
  } catch (error) {
    console.error("Failed to cleanup temp dir:", error);
  }
}

/**
 * Get the problem YAML content for the executor.
 * Returns merged themed YAML, or reads the raw problem.yaml from disk.
 */
async function getProblemYamlContent(
  problemId: string,
  problemDir: string,
  themeId?: string
): Promise<string> {
  // Try themed merge first
  const mergedYaml = await buildMergedProblemYaml(problemId, themeId);
  if (mergedYaml) {
    return mergedYaml;
  }

  // Fallback: read raw problem.yaml from the problem directory
  const rawPath = path.join(problemDir, "problem.yaml");
  return readFile(rawPath, "utf-8");
}

/**
 * Execute code via Modal cloud sandbox.
 */
async function executeViaModal(
  code: string,
  problemYaml: string
): Promise<ExecutionResult> {
  const start = performance.now();
  console.log("[execute] Modal request starting:", {
    endpoint: MODAL_ENDPOINT_URL,
    codeLength: code.length,
    yamlLength: problemYaml.length,
  });

  const response = await fetch(MODAL_ENDPOINT_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      problem_yaml: problemYaml,
    }),
  });

  const elapsed = Math.round(performance.now() - start);

  if (!response.ok) {
    const text = await response.text();
    console.error("[execute] Modal request failed:", {
      status: response.status,
      elapsed: `${elapsed}ms`,
      body: text.slice(0, 500),
    });
    throw new Error(`Modal execution failed (${response.status}): ${text}`);
  }

  const result: ExecutionResult = await response.json();
  console.log("[execute] Modal request completed:", {
    elapsed: `${elapsed}ms`,
    passed: result.passed,
    failed: result.failed,
    total: result.total,
    error: result.error || null,
  });

  return result;
}

/**
 * Execute code via local Docker container (fallback).
 */
async function executeViaDocker(
  code: string,
  problemDir: string,
  problemId: string,
  themeId?: string
): Promise<ExecutionResult> {
  let tempDir: string | null = null;

  try {
    await acquireLock();

    tempDir = await createTempDir();
    const solutionPath = path.join(tempDir, "solution.py");
    await writeFile(solutionPath, code, "utf-8");

    // For themed problems, build a merged problem.yaml
    let mountProblemDir = problemDir;
    const mergedYaml = await buildMergedProblemYaml(problemId, themeId);
    if (mergedYaml) {
      const mergedProblemDir = path.join(tempDir, "problem");
      await mkdir(mergedProblemDir, { recursive: true });
      await writeFile(
        path.join(mergedProblemDir, "problem.yaml"),
        mergedYaml,
        "utf-8"
      );
      mountProblemDir = mergedProblemDir;
    }

    const dockerCmd = [
      DOCKER_PATH,
      "run",
      "--rm",
      `--memory=${MAX_MEMORY}`,
      "--cpus=1",
      "--network=none",
      "--read-only",
      "--tmpfs=/tmp:noexec,nosuid,size=64m",
      "-v",
      `${mountProblemDir}:/code/problem:ro`,
      "-v",
      `${solutionPath}:/code/solution.py:ro`,
      DOCKER_IMAGE,
      "python",
      "/code/run_tests.py",
    ].join(" ");

    const { stdout, stderr } = await execAsync(dockerCmd, {
      timeout: EXECUTION_TIMEOUT,
      maxBuffer: 1024 * 1024,
    });

    const output = stdout.trim() || stderr.trim();
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      success: false,
      total: 0,
      passed: 0,
      failed: 0,
      results: [],
      error: output || "No JSON found in output",
    };
  } finally {
    releaseLock();
    if (tempDir) {
      await cleanupTempDir(tempDir);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ExecutionRequest = await request.json();
    const { problemId, code, language = "python", themeId } = body;

    // Validate inputs
    if (!problemId || !code) {
      return NextResponse.json(
        { error: "Missing required fields: problemId, code" },
        { status: 400 }
      );
    }

    if (!isValidProblemId(problemId)) {
      return NextResponse.json(
        { error: "Invalid problem ID" },
        { status: 400 }
      );
    }

    if (language !== "python") {
      return NextResponse.json(
        { error: "Only Python is currently supported" },
        { status: 400 }
      );
    }

    // Check if problem exists
    const exists = await problemExists(problemId);
    if (!exists) {
      return NextResponse.json(
        { error: `Problem not found: ${problemId}` },
        { status: 404 }
      );
    }

    const problemDir = getProblemDir(problemId);
    if (!problemDir) {
      return NextResponse.json(
        { error: "Invalid problem path" },
        { status: 400 }
      );
    }

    // Route to Modal or Docker
    const executor = MODAL_ENDPOINT_URL ? "modal" : "docker";
    const startTime = performance.now();

    console.log("[execute] Starting execution:", {
      executor,
      problemId,
      themeId: themeId || "default",
      userId: session.user.id,
      codeLength: code.length,
    });

    let result: ExecutionResult;

    if (MODAL_ENDPOINT_URL) {
      const problemYaml = await getProblemYamlContent(problemId, problemDir, themeId);
      result = await executeViaModal(code, problemYaml);
    } else {
      result = await executeViaDocker(code, problemDir, problemId, themeId);
    }

    const totalElapsed = Math.round(performance.now() - startTime);

    console.log("[execute] Execution complete:", {
      executor,
      problemId,
      totalElapsed: `${totalElapsed}ms`,
      passed: result.passed,
      failed: result.failed,
      total: result.total,
    });

    return NextResponse.json({
      ...result,
      _meta: {
        executor,
        totalMs: totalElapsed,
      },
    });
  } catch (error) {
    const err = error as Error & { killed?: boolean; code?: string; stdout?: string; stderr?: string };

    // Handle timeout
    if (err.killed) {
      return NextResponse.json({
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        results: [],
        error: "Execution timed out",
      });
    }

    // Handle Docker not available (only relevant for Docker fallback)
    if (err.code === "ENOENT" && !MODAL_ENDPOINT_URL) {
      return NextResponse.json({
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        results: [],
        error:
          "Docker is not available. Please ensure Docker is installed and running.",
      });
    }

    // Try to parse JSON from stdout/stderr (docker exits non-zero when tests fail)
    const output = (err.stdout || err.stderr || "").trim();
    if (output) {
      try {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]) as ExecutionResult;
          return NextResponse.json(result);
        }
      } catch {
        // Fall through to error handling
      }
    }

    console.error("Execution error:", err);
    return NextResponse.json(
      {
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        results: [],
        error: output || err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Code execution endpoint. Use POST to execute code.",
    executor: MODAL_ENDPOINT_URL ? "modal" : "docker",
  });
}
