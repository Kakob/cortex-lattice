/**
 * Slash Command Parser
 *
 * Parses slash command syntax from editor input.
 * Supports:
 * - /problem new "content"
 * - /solution new "content"
 * - /guidance /select ref1 ref2 "content"
 */

import type { ParsedCommand, SlashCommandType, SlashSubcommand } from "@/lib/types";

/** Valid slash commands */
const VALID_COMMANDS: SlashCommandType[] = ["problem", "solution", "guidance"];

/** Valid subcommands for each command */
const VALID_SUBCOMMANDS: Record<SlashCommandType, SlashSubcommand[]> = {
  problem: ["new"],
  solution: ["new"],
  guidance: ["select"],
};

/**
 * Extract quoted content from a string.
 * Supports both single and double quotes.
 */
function extractQuotedContent(input: string): { content: string; remaining: string } | null {
  const trimmed = input.trim();

  // Try double quotes first
  const doubleQuoteMatch = trimmed.match(/^"((?:[^"\\]|\\.)*)"\s*$/);
  if (doubleQuoteMatch) {
    return {
      content: doubleQuoteMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
      remaining: "",
    };
  }

  // Try single quotes
  const singleQuoteMatch = trimmed.match(/^'((?:[^'\\]|\\.)*)'\s*$/);
  if (singleQuoteMatch) {
    return {
      content: singleQuoteMatch[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
      remaining: "",
    };
  }

  return null;
}

/**
 * Parse references from guidance command (ref1 ref2 ... "content")
 */
function parseGuidanceReferences(input: string): { references: string[]; content: string } | null {
  const parts = input.trim().split(/\s+/);
  const references: string[] = [];
  let contentStart = -1;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Check if this part starts with a quote (beginning of content)
    if (part.startsWith('"') || part.startsWith("'")) {
      contentStart = i;
      break;
    }

    // Otherwise it's a reference ID
    references.push(part);
  }

  if (contentStart === -1 || references.length === 0) {
    return null;
  }

  // Rejoin the content parts
  const contentString = parts.slice(contentStart).join(" ");
  const extracted = extractQuotedContent(contentString);

  if (!extracted) {
    return null;
  }

  return {
    references,
    content: extracted.content,
  };
}

/**
 * Check if a line starts with a slash command.
 */
export function isSlashCommand(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("/") && VALID_COMMANDS.some(cmd =>
    trimmed.startsWith(`/${cmd}`)
  );
}

/**
 * Check if user is typing a potential slash command (for autocomplete).
 */
export function isTypingSlashCommand(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("/")) {
    return false;
  }

  // Just "/" or partial command like "/pro", "/sol", "/gui"
  if (trimmed === "/") {
    return true;
  }

  // Check if it matches the start of any valid command
  const afterSlash = trimmed.slice(1).toLowerCase();
  return VALID_COMMANDS.some(cmd => cmd.startsWith(afterSlash));
}

/**
 * Get autocomplete suggestions based on current input.
 */
export function getAutocompleteSuggestions(line: string): string[] {
  const trimmed = line.trim().toLowerCase();

  if (trimmed === "/") {
    return VALID_COMMANDS.map(cmd => `/${cmd}`);
  }

  const afterSlash = trimmed.slice(1);
  return VALID_COMMANDS
    .filter(cmd => cmd.startsWith(afterSlash))
    .map(cmd => `/${cmd}`);
}

/**
 * Parse a slash command string.
 */
export function parseSlashCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  // Basic validation
  if (!trimmed.startsWith("/")) {
    return {
      command: "problem",
      subcommand: "new",
      content: "",
      raw: input,
      isValid: false,
      error: "Command must start with /",
    };
  }

  // Split by whitespace to get parts
  const parts = trimmed.split(/\s+/);
  const commandPart = parts[0].slice(1).toLowerCase(); // Remove leading /

  // Validate command
  if (!VALID_COMMANDS.includes(commandPart as SlashCommandType)) {
    return {
      command: "problem",
      subcommand: "new",
      content: "",
      raw: input,
      isValid: false,
      error: `Unknown command: /${commandPart}. Valid commands: ${VALID_COMMANDS.map(c => "/" + c).join(", ")}`,
    };
  }

  const command = commandPart as SlashCommandType;

  // Handle guidance command specially (has /select subcommand)
  if (command === "guidance") {
    // Expect: /guidance /select ref1 ref2 "content"
    if (parts.length < 2 || parts[1] !== "/select") {
      return {
        command,
        subcommand: "select",
        content: "",
        raw: input,
        isValid: false,
        error: 'Guidance command requires /select subcommand. Usage: /guidance /select ref1 ref2 "content"',
      };
    }

    // Parse references and content
    const afterSelect = parts.slice(2).join(" ");
    const parsed = parseGuidanceReferences(afterSelect);

    if (!parsed) {
      return {
        command,
        subcommand: "select",
        content: "",
        raw: input,
        isValid: false,
        error: 'Invalid guidance syntax. Usage: /guidance /select ref1 ref2 "content"',
      };
    }

    return {
      command,
      subcommand: "select",
      content: parsed.content,
      references: parsed.references,
      raw: input,
      isValid: true,
    };
  }

  // Handle problem/solution commands
  // Expect: /problem new "content" or /solution new "content"
  if (parts.length < 2) {
    return {
      command,
      subcommand: "new",
      content: "",
      raw: input,
      isValid: false,
      error: `Missing subcommand. Usage: /${command} new "content"`,
    };
  }

  const subcommandPart = parts[1].toLowerCase();

  if (!VALID_SUBCOMMANDS[command].includes(subcommandPart as SlashSubcommand)) {
    return {
      command,
      subcommand: "new",
      content: "",
      raw: input,
      isValid: false,
      error: `Invalid subcommand: ${subcommandPart}. Valid subcommands for /${command}: ${VALID_SUBCOMMANDS[command].join(", ")}`,
    };
  }

  const subcommand = subcommandPart as SlashSubcommand;

  // Extract content
  const contentString = parts.slice(2).join(" ");

  if (!contentString) {
    return {
      command,
      subcommand,
      content: "",
      raw: input,
      isValid: false,
      error: `Missing content. Usage: /${command} ${subcommand} "your content here"`,
    };
  }

  const extracted = extractQuotedContent(contentString);

  if (!extracted) {
    return {
      command,
      subcommand,
      content: "",
      raw: input,
      isValid: false,
      error: `Content must be wrapped in quotes. Usage: /${command} ${subcommand} "your content here"`,
    };
  }

  if (!extracted.content.trim()) {
    return {
      command,
      subcommand,
      content: "",
      raw: input,
      isValid: false,
      error: "Content cannot be empty",
    };
  }

  return {
    command,
    subcommand,
    content: extracted.content,
    raw: input,
    isValid: true,
  };
}

/**
 * Get command syntax help.
 */
export function getCommandSyntax(command: SlashCommandType): string {
  switch (command) {
    case "problem":
      return '/problem new "describe your confusion or stuck point"';
    case "solution":
      return '/solution new "describe your breakthrough or insight"';
    case "guidance":
      return '/guidance /select problem_id solution_id "your teaching guidance"';
    default:
      return "";
  }
}

/**
 * Get command example.
 */
export function getCommandExample(command: SlashCommandType): string {
  switch (command) {
    case "problem":
      return '/problem new "I don\'t understand why we need two pointers here"';
    case "solution":
      return '/solution new "The key insight is that sorted arrays allow O(1) decisions at each step"';
    case "guidance":
      return '/guidance /select prob_abc123 sol_def456 "Think about what information the sorted property gives you"';
    default:
      return "";
  }
}
