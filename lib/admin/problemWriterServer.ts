/**
 * Problem Writer Server Utility
 *
 * Server-only functions for writing problem files to disk.
 * Import this only in server components or API routes.
 */

import fs from "fs/promises";
import path from "path";
import { ProblemFormData } from "@/lib/schemas/problemSchema";
import { toYamlString } from "./problemWriter";

/**
 * Check if a problem directory already exists
 */
export async function problemExists(id: string): Promise<boolean> {
  const problemDir = path.join(process.cwd(), "problems", id);
  try {
    await fs.access(problemDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write problem.yaml to the problems directory
 */
export async function writeProblemYaml(data: ProblemFormData): Promise<void> {
  const problemDir = path.join(process.cwd(), "problems", data.id);
  const problemFile = path.join(problemDir, "problem.yaml");

  // Create directory
  await fs.mkdir(problemDir, { recursive: true });

  // Write YAML file
  const yamlContent = toYamlString(data);
  await fs.writeFile(problemFile, yamlContent, "utf-8");
}
