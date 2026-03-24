#!/usr/bin/env npx tsx
/**
 * AI-Assisted Problem Generation Script
 *
 * Usage:
 *   npx tsx scripts/generate-problem.ts --pattern two-pointers --index 0
 *   npx tsx scripts/generate-problem.ts --title "Pair with Target Sum"
 *   npx tsx scripts/generate-problem.ts --batch --pattern two-pointers
 *   npx tsx scripts/generate-problem.ts --pattern two-pointers --index 0 --themes wizard-dungeon,finance
 *   npx tsx scripts/generate-problem.ts --pattern two-pointers --index 0 --skip-docker
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, mkdir, access } from "fs/promises";
import path from "path";
import yaml from "yaml";
import {
  GTCI_CURRICULUM,
  type CurriculumProblem,
} from "../lib/curriculum";
import { PATTERNS, THEME_INFO } from "../lib/generation/patterns";
import {
  buildPhaseAPrompt,
  buildPhaseBPrompt,
  buildRetryPrompt,
  type GenerationSpec,
} from "../lib/generation/prompts";
import { parseGenerationResponse, findFile } from "../lib/generation/parser";
import {
  validateCore,
  validateSolution,
  validateThemedProblem,
  validateGuidance,
  validateMistakes,
  validateInvariants,
  crossValidateCore,
} from "../lib/generation/validator";
import { runSolutionInDocker } from "../lib/generation/runner";

// ============================================================================
// Configuration
// ============================================================================

const PROBLEMS_DIR = path.join(process.cwd(), "problems");
const EXEMPLAR_DIR = path.join(PROBLEMS_DIR, "two-pointers-pair-distance");
const MAX_RETRIES = 3;
const MODEL = "claude-sonnet-4-20250514";

const DEFAULT_THEMES = [
  "wizard-dungeon",
  "software-engineering",
  "finance",
  "medicine",
];

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
  pattern?: string;
  index?: number;
  title?: string;
  batch: boolean;
  themes: string[];
  force: boolean;
  skipDocker: boolean;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    batch: false,
    themes: DEFAULT_THEMES,
    force: false,
    skipDocker: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--pattern":
        result.pattern = args[++i];
        break;
      case "--index":
        result.index = parseInt(args[++i], 10);
        break;
      case "--title":
        result.title = args[++i];
        break;
      case "--batch":
        result.batch = true;
        break;
      case "--themes":
        result.themes = args[++i].split(",");
        break;
      case "--force":
        result.force = true;
        break;
      case "--skip-docker":
        result.skipDocker = true;
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--help":
        printUsage();
        process.exit(0);
    }
  }

  return result;
}

function printUsage() {
  console.log(`
Usage: npx tsx scripts/generate-problem.ts [options]

Options:
  --pattern <key>       Pattern key (e.g., two-pointers)
  --index <n>           Problem index within pattern (0-based)
  --title <title>       Find problem by curriculum title
  --batch               Generate all problems in the pattern
  --themes <list>       Comma-separated theme IDs (default: wizard-dungeon,software-engineering,finance,medicine)
  --force               Regenerate even if problem already exists
  --skip-docker         Skip Docker validation (faster, less safe)
  --dry-run             Show what would be generated without doing it
  --help                Show this help message
`);
}

// ============================================================================
// Problem ID Generation
// ============================================================================

function makeProblemId(entry: CurriculumProblem): string {
  return `${entry.patternKey}-${entry.normalizedTitle}`;
}

// ============================================================================
// Exemplar Loading
// ============================================================================

async function loadExemplar(): Promise<{
  core: string;
  solution: string;
  problem: string;
  guidance: string;
}> {
  const [core, solution, problem, guidance] = await Promise.all([
    readFile(path.join(EXEMPLAR_DIR, "core.yaml"), "utf-8"),
    readFile(
      path.join(EXEMPLAR_DIR, "themes/coding-interview/solution.yaml"),
      "utf-8"
    ),
    readFile(
      path.join(EXEMPLAR_DIR, "themes/coding-interview/problem.yaml"),
      "utf-8"
    ),
    readFile(
      path.join(EXEMPLAR_DIR, "themes/coding-interview/guidance.yaml"),
      "utf-8"
    ),
  ]);

  return { core, solution, problem, guidance };
}

// ============================================================================
// File Existence Check
// ============================================================================

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Phase A: Generate Core + Solution
// ============================================================================

async function generatePhaseA(
  client: Anthropic,
  spec: GenerationSpec,
  exemplar: { core: string; solution: string },
  skipDocker: boolean
): Promise<{ coreYaml: string; coreData: unknown; solutionYaml: string; solutionData: unknown }> {
  const prompt = buildPhaseAPrompt(spec, exemplar.core, exemplar.solution);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const currentPrompt =
      attempt === 0
        ? prompt
        : buildRetryPrompt(prompt, lastError!, attempt);

    console.log(
      `  Phase A${attempt > 0 ? ` (retry ${attempt})` : ""}: Generating core.yaml + solution.yaml...`
    );

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: currentPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const files = parseGenerationResponse(text);

    const coreFile = findFile(files, "core.yaml");
    const solutionFile = findFile(files, "solution.yaml");

    if (!coreFile || !solutionFile) {
      lastError = `Missing files. Found: ${files.map((f) => f.path).join(", ")}`;
      console.log(`    Failed: ${lastError}`);
      continue;
    }

    // Structural validation
    const coreValidation = validateCore(coreFile.parsed);
    if (!coreValidation.valid) {
      lastError = `core.yaml validation:\n${coreValidation.errors.join("\n")}`;
      console.log(`    Failed: ${lastError}`);
      continue;
    }

    const crossValidation = crossValidateCore(coreFile.parsed as any);
    if (!crossValidation.valid) {
      lastError = `cross-validation:\n${crossValidation.errors.join("\n")}`;
      console.log(`    Failed: ${lastError}`);
      continue;
    }

    const solutionValidation = validateSolution(solutionFile.parsed);
    if (!solutionValidation.valid) {
      lastError = `solution.yaml validation:\n${solutionValidation.errors.join("\n")}`;
      console.log(`    Failed: ${lastError}`);
      continue;
    }

    // Docker validation
    if (!skipDocker) {
      console.log("    Running solution against test cases in Docker...");
      const solutionData = solutionFile.parsed as {
        solution_code_python: string;
      };
      const coreData = coreFile.parsed as {
        test_case_data: Array<{
          id: string;
          input: Record<string, unknown>;
          expected: unknown;
        }>;
      };

      // Build a minimal starter code from the solution for function name detection
      const starterCode = solutionData.solution_code_python;

      const runResult = await runSolutionInDocker(
        coreData,
        solutionData.solution_code_python,
        starterCode
      );

      if (!runResult.success) {
        lastError = `Docker validation failed (${runResult.passed}/${runResult.total} passed):\n${runResult.details || runResult.error}`;
        console.log(`    Failed: ${lastError}`);
        continue;
      }

      console.log(
        `    Docker validation passed: ${runResult.passed}/${runResult.total} tests`
      );
    }

    return {
      coreYaml: coreFile.content,
      coreData: coreFile.parsed,
      solutionYaml: solutionFile.content,
      solutionData: solutionFile.parsed,
    };
  }

  throw new Error(
    `Phase A failed after ${MAX_RETRIES + 1} attempts for ${spec.problemId}`
  );
}

let lastError: string | undefined;

// ============================================================================
// Phase B: Generate Themed Content
// ============================================================================

async function generatePhaseB(
  client: Anthropic,
  spec: GenerationSpec,
  themeId: string,
  coreYaml: string,
  solutionYaml: string,
  exemplar: { problem: string; guidance: string }
): Promise<{
  problemYaml: string;
  guidanceYaml: string;
  mistakesYaml: string;
  invariantsYaml: string;
}> {
  const prompt = buildPhaseBPrompt(
    spec,
    themeId,
    coreYaml,
    solutionYaml,
    exemplar.problem,
    exemplar.guidance
  );

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const currentPrompt =
      attempt === 0 ? prompt : buildRetryPrompt(prompt, lastError!, attempt);

    console.log(
      `  Phase B [${themeId}]${attempt > 0 ? ` (retry ${attempt})` : ""}: Generating themed content...`
    );

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: currentPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const files = parseGenerationResponse(text);

    const problemFile = findFile(files, "problem.yaml");
    const guidanceFile = findFile(files, "guidance.yaml");
    const mistakesFile = findFile(files, "mistakes.yaml");
    const invariantsFile = findFile(files, "invariants.yaml");

    if (!problemFile || !guidanceFile || !mistakesFile || !invariantsFile) {
      const found = files.map((f) => f.path).join(", ");
      lastError = `Missing files. Found: ${found}. Need: problem.yaml, guidance.yaml, mistakes.yaml, invariants.yaml`;
      console.log(`    Failed: ${lastError}`);
      continue;
    }

    // Validate each file
    const validations = [
      { name: "problem.yaml", result: validateThemedProblem(problemFile.parsed) },
      { name: "guidance.yaml", result: validateGuidance(guidanceFile.parsed) },
      { name: "mistakes.yaml", result: validateMistakes(mistakesFile.parsed) },
      { name: "invariants.yaml", result: validateInvariants(invariantsFile.parsed) },
    ];

    const failures = validations.filter((v) => !v.result.valid);
    if (failures.length > 0) {
      lastError = failures
        .flatMap((v) => v.result.errors)
        .join("\n");
      console.log(`    Failed: ${lastError}`);
      continue;
    }

    console.log(`    Theme "${themeId}" generated successfully`);

    return {
      problemYaml: problemFile.content,
      guidanceYaml: guidanceFile.content,
      mistakesYaml: mistakesFile.content,
      invariantsYaml: invariantsFile.content,
    };
  }

  throw new Error(
    `Phase B failed after ${MAX_RETRIES + 1} attempts for ${spec.problemId} theme ${themeId}`
  );
}

// ============================================================================
// File Writing
// ============================================================================

async function writeProblemFiles(
  spec: GenerationSpec,
  phaseA: { coreYaml: string; solutionYaml: string },
  themes: Record<
    string,
    {
      problemYaml: string;
      solutionYaml: string;
      guidanceYaml: string;
      mistakesYaml: string;
      invariantsYaml: string;
    }
  >
) {
  const problemDir = path.join(PROBLEMS_DIR, spec.problemId);

  // Write core.yaml
  await mkdir(problemDir, { recursive: true });
  await writeFile(
    path.join(problemDir, "core.yaml"),
    phaseA.coreYaml,
    "utf-8"
  );

  // Write each theme
  for (const [themeId, themeFiles] of Object.entries(themes)) {
    const themeDir = path.join(problemDir, "themes", themeId);
    await mkdir(themeDir, { recursive: true });

    await Promise.all([
      writeFile(path.join(themeDir, "problem.yaml"), themeFiles.problemYaml, "utf-8"),
      writeFile(path.join(themeDir, "solution.yaml"), themeFiles.solutionYaml, "utf-8"),
      writeFile(path.join(themeDir, "guidance.yaml"), themeFiles.guidanceYaml, "utf-8"),
      writeFile(path.join(themeDir, "mistakes.yaml"), themeFiles.mistakesYaml, "utf-8"),
      writeFile(path.join(themeDir, "invariants.yaml"), themeFiles.invariantsYaml, "utf-8"),
    ]);
  }

  console.log(`  Written to: ${problemDir}`);
}

// ============================================================================
// Main Generation Flow
// ============================================================================

async function generateOneProblem(
  client: Anthropic,
  entry: CurriculumProblem,
  themes: string[],
  exemplar: Awaited<ReturnType<typeof loadExemplar>>,
  options: { force: boolean; skipDocker: boolean; dryRun: boolean }
) {
  const problemId = makeProblemId(entry);
  const problemDir = path.join(PROBLEMS_DIR, problemId);

  if (!options.force && (await exists(path.join(problemDir, "core.yaml")))) {
    console.log(`  Skipping ${problemId} (already exists, use --force to regenerate)`);
    return;
  }

  const spec: GenerationSpec = {
    curriculumTitle: entry.title,
    normalizedTitle: entry.normalizedTitle,
    patternKey: entry.patternKey,
    difficulty: entry.difficulty,
    index: entry.index,
    problemId,
    themes,
  };

  if (options.dryRun) {
    console.log(`  Would generate: ${problemId}`);
    console.log(`    Pattern: ${entry.patternKey}, Difficulty: ${entry.difficulty}`);
    console.log(`    Themes: ${themes.join(", ")}`);
    return;
  }

  console.log(
    `\nGenerating: ${entry.title} (${entry.difficulty}) → ${problemId}`
  );

  // Phase A: Core + Solution
  const phaseA = await generatePhaseA(
    client,
    spec,
    { core: exemplar.core, solution: exemplar.solution },
    options.skipDocker
  );

  // Phase B: Themed content for each theme
  const themeResults: Record<string, any> = {};

  for (const themeId of themes) {
    const themeContent = await generatePhaseB(
      client,
      spec,
      themeId,
      phaseA.coreYaml,
      phaseA.solutionYaml,
      { problem: exemplar.problem, guidance: exemplar.guidance }
    );

    themeResults[themeId] = {
      ...themeContent,
      solutionYaml: phaseA.solutionYaml, // Same solution for all themes
    };
  }

  // Write all files
  await writeProblemFiles(spec, phaseA, themeResults);
  console.log(`  Done: ${problemId}\n`);
}

// ============================================================================
// Entry Point
// ============================================================================

async function main() {
  const args = parseArgs();

  if (!args.pattern && !args.title) {
    console.error("Error: Must specify --pattern or --title");
    printUsage();
    process.exit(1);
  }

  // Validate themes
  for (const theme of args.themes) {
    if (!THEME_INFO[theme]) {
      console.error(
        `Error: Unknown theme "${theme}". Available: ${Object.keys(THEME_INFO).join(", ")}`
      );
      process.exit(1);
    }
  }

  // Find curriculum entries
  let entries: CurriculumProblem[];

  if (args.title) {
    const entry = GTCI_CURRICULUM.find(
      (e) => e.title.toLowerCase() === args.title!.toLowerCase()
    );
    if (!entry) {
      console.error(`Error: No curriculum entry found for "${args.title}"`);
      process.exit(1);
    }
    entries = [entry];
  } else if (args.batch) {
    entries = GTCI_CURRICULUM.filter((e) => e.patternKey === args.pattern);
    if (entries.length === 0) {
      console.error(`Error: No problems found for pattern "${args.pattern}"`);
      process.exit(1);
    }
  } else {
    const entry = GTCI_CURRICULUM.find(
      (e) => e.patternKey === args.pattern && e.index === args.index
    );
    if (!entry) {
      console.error(
        `Error: No curriculum entry for pattern="${args.pattern}" index=${args.index}`
      );
      process.exit(1);
    }
    entries = [entry];
  }

  console.log(`\n=== Cortex Lattice Problem Generator ===`);
  console.log(`Problems to generate: ${entries.length}`);
  console.log(`Themes: ${args.themes.join(", ")}`);
  console.log(`Skip Docker: ${args.skipDocker}`);
  console.log(`Force: ${args.force}\n`);

  // Load exemplar
  console.log("Loading exemplar...");
  const exemplar = await loadExemplar();

  // Initialize Anthropic client
  const client = new Anthropic();

  // Generate each problem
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await generateOneProblem(client, entry, args.themes, exemplar, {
        force: args.force,
        skipDocker: args.skipDocker,
        dryRun: args.dryRun,
      });
      generated++;
    } catch (err) {
      console.error(`  FAILED: ${entry.title} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${entries.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
