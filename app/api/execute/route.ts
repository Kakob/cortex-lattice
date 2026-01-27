/**
 * Cortex Lattice - Code Execution API
 *
 * POST /api/execute
 *
 * Executes user code against problem test cases in a Docker sandbox.
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { problemExists, getProblemDir } from "@/lib/problems";
import type { ExecutionRequest, ExecutionResult } from "@/lib/types";

const execAsync = promisify(exec);

// Configuration
const DOCKER_PATH = process.env.DOCKER_PATH || "/usr/local/bin/docker";
const DOCKER_IMAGE = process.env.DOCKER_IMAGE || "cortex-executor:latest";
const EXECUTION_TIMEOUT = parseInt(
  process.env.EXECUTION_TIMEOUT || "30000",
  10
);
const MAX_MEMORY = process.env.MAX_MEMORY || "512m";
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || "3", 10);

// Simple semaphore for limiting concurrent executions
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
  // Only allow alphanumeric characters, hyphens, and underscores
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

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    // Parse request body
    const body: ExecutionRequest = await request.json();
    const { problemId, code, language = "python" } = body;

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

    // Acquire execution lock
    await acquireLock();

    try {
      // Create temp directory and write user code
      tempDir = await createTempDir();
      const solutionPath = path.join(tempDir, "solution.py");
      await writeFile(solutionPath, code, "utf-8");

      // Build Docker command
      const dockerCmd = [
        DOCKER_PATH,
        "run",
        "--rm", // Remove container after execution
        `--memory=${MAX_MEMORY}`, // Memory limit
        "--cpus=1", // CPU limit
        "--network=none", // No network access
        "--read-only", // Read-only filesystem
        "--tmpfs=/tmp:noexec,nosuid,size=64m", // Temp space
        "-v",
        `${problemDir}:/code/problem:ro`, // Mount problem (read-only)
        "-v",
        `${solutionPath}:/code/solution.py:ro`, // Mount solution (read-only)
        DOCKER_IMAGE,
        "python",
        "/code/run_tests.py",
      ].join(" ");

      // Execute with timeout
      const { stdout, stderr } = await execAsync(dockerCmd, {
        timeout: EXECUTION_TIMEOUT,
        maxBuffer: 1024 * 1024, // 1MB output limit
      });

      // Parse results - try stdout first, then stderr (some docker configs output to stderr)
      let result: ExecutionResult;
      const output = stdout.trim() || stderr.trim();

      try {
        // Find JSON in the output (in case there's extra text)
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in output");
        }
      } catch (parseError) {
        result = {
          success: false,
          total: 0,
          passed: 0,
          failed: 0,
          results: [],
          error: output || "Failed to parse execution result",
        };
      }

      return NextResponse.json(result);
    } finally {
      releaseLock();
    }
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

    // Handle Docker not available
    if (err.code === "ENOENT") {
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
  } finally {
    // Cleanup temp directory
    if (tempDir) {
      await cleanupTempDir(tempDir);
    }
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Code execution endpoint. Use POST to execute code.",
  });
}
