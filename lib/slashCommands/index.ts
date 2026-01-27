/**
 * Slash Commands Module
 *
 * Re-exports all slash command utilities.
 */

export {
  parseSlashCommand,
  isSlashCommand,
  isTypingSlashCommand,
  getAutocompleteSuggestions,
  getCommandSyntax,
  getCommandExample,
} from "./parser";

export {
  captureEditorContext,
  extractCodeSnippet,
  detectStuckScore,
  calculateTimeSinceStart,
  formatDuration,
} from "./context";

export {
  shouldAutoLink,
  findRecentProblems,
  generateAutoLinkCandidates,
  createAutoLinks,
} from "./autoLink";

export { executeSlashCommand } from "./handler";
