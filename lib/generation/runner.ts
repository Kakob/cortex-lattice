/**
 * Docker-based functional validation.
 * Runs generated solutions against test cases to verify correctness.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import yaml from "yaml";

const execAsync = promisify(exec);

const DOCKER_PATH = process.env.DOCKER_PATH || "/usr/local/bin/docker";
const DOCKER_IMAGE = process.env.DOCKER_IMAGE || "cortex-executor:latest";
const EXECUTION_TIMEOUT = 30000;

export interface RunResult {
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  error?: string;
  details?: string;
}

/**
 * Run a solution against test cases in the Docker sandbox.
 *
 * @param coreData - Parsed core.yaml data
 * @param solutionCode - Python solution code
 * @param starterCode - Python starter code (for function name detection)
 */
export async function runSolutionInDocker(
  coreData: {
    test_case_data: Array<{
      id: string;
      input: Record<string, unknown>;
      expected: unknown;
    }>;
  },
  solutionCode: string,
  starterCode: string
): Promise<RunResult> {
  const tempDir = path.join(
    process.cwd(),
    ".tmp",
    `validate-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  try {
    await mkdir(tempDir, { recursive: true });
    const problemDir = path.join(tempDir, "problem");
    await mkdir(problemDir, { recursive: true });

    // Build a merged problem.yaml the test runner expects
    const mergedProblem = {
      id: "validation",
      title: "Validation",
      difficulty: "easy",
      pattern: "validation",
      description: "Validation run",
      constraints: [],
      starter_code_python: starterCode,
      test_cases: coreData.test_case_data.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expected: tc.expected,
      })),
    };

    await writeFile(
      path.join(problemDir, "problem.yaml"),
      yaml.stringify(mergedProblem),
      "utf-8"
    );

    const solutionPath = path.join(tempDir, "solution.py");
    await writeFile(solutionPath, solutionCode, "utf-8");

    const dockerCmd = [
      DOCKER_PATH,
      "run",
      "--rm",
      "--memory=512m",
      "--cpus=1",
      "--network=none",
      "--read-only",
      "--tmpfs=/tmp:noexec,nosuid,size=64m",
      "-v",
      `${problemDir}:/code/problem:ro`,
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
    if (!jsonMatch) {
      return {
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        error: "No JSON output from test runner",
        details: output,
      };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      success: result.success,
      total: result.total,
      passed: result.passed,
      failed: result.failed,
      error: result.error,
      details: result.results
        ?.filter((r: { passed: boolean }) => !r.passed)
        ?.map(
          (r: { test_id: string; error?: string; expected?: unknown; actual?: unknown }) =>
            `Test ${r.test_id}: ${r.error || `expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`}`
        )
        .join("\n"),
    };
  } catch (err) {
    const error = err as Error & {
      killed?: boolean;
      stdout?: string;
      stderr?: string;
    };

    // Try to parse JSON from error output (test failures exit non-zero)
    const output = (error.stdout || error.stderr || "").trim();
    if (output) {
      try {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            success: result.success,
            total: result.total,
            passed: result.passed,
            failed: result.failed,
            error: result.error,
            details: result.results
              ?.filter((r: { passed: boolean }) => !r.passed)
              ?.map(
                (r: { test_id: string; error?: string; expected?: unknown; actual?: unknown }) =>
                  `Test ${r.test_id}: ${r.error || `expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`}`
              )
              .join("\n"),
          };
        }
      } catch {
        // Fall through
      }
    }

    if (error.killed) {
      return {
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        error: "Execution timed out",
      };
    }

    return {
      success: false,
      total: 0,
      passed: 0,
      failed: 0,
      error: error.message,
      details: output,
    };
  } finally {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Cleanup failure is not critical
    }
  }
}
