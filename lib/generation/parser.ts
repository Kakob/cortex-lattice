/**
 * Parser for extracting multiple YAML files from Claude's response.
 *
 * Expects the response to contain file blocks delimited by:
 *   --- FILE: <path> ---
 *   ```yaml
 *   <content>
 *   ```
 */

import yaml from "yaml";

export interface ParsedFile {
  path: string;
  content: string;
  parsed: unknown;
}

/**
 * Extract YAML file blocks from Claude's response text.
 */
export function parseGenerationResponse(text: string): ParsedFile[] {
  const files: ParsedFile[] = [];

  // Match blocks: --- FILE: <path> ---\n```yaml\n<content>\n```
  const blockRegex =
    /---\s*FILE:\s*(.+?)\s*---\s*\n```(?:yaml|yml)?\n([\s\S]*?)```/g;

  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    const filePath = match[1].trim();
    const content = match[2].trim();

    try {
      const parsed = yaml.parse(content);
      files.push({ path: filePath, content, parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse YAML for ${filePath}: ${message}`);
    }
  }

  if (files.length === 0) {
    // Try a fallback: single YAML block without FILE delimiter
    const singleBlockRegex = /```(?:yaml|yml)?\n([\s\S]*?)```/g;
    const singleMatch = singleBlockRegex.exec(text);
    if (singleMatch) {
      const content = singleMatch[1].trim();
      try {
        const parsed = yaml.parse(content);
        files.push({ path: "output.yaml", content, parsed });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse YAML: ${message}`);
      }
    }
  }

  return files;
}

/**
 * Extract a specific file from parsed results by path suffix.
 */
export function findFile(
  files: ParsedFile[],
  pathSuffix: string
): ParsedFile | undefined {
  return files.find(
    (f) => f.path === pathSuffix || f.path.endsWith("/" + pathSuffix)
  );
}
