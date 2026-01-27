/**
 * Slash Command Handler
 *
 * Executes parsed slash commands by calling the API
 * and handling auto-linking.
 */

import type {
  ParsedCommand,
  CommandResult,
  ContributionContext,
  SessionContext,
  InlineContribution,
  CreateContributionInput,
  ContributionReferences,
} from "@/lib/types";
import { generateAutoLinkCandidates, createAutoLinks } from "./autoLink";

/**
 * Fetch recent problem contributions for auto-linking.
 */
async function fetchRecentProblems(
  sessionId: string,
  problemId: string,
  limit: number = 5
): Promise<InlineContribution[]> {
  try {
    const params = new URLSearchParams({
      sessionId,
      problemId,
      command: "problem",
      limit: limit.toString(),
    });

    const response = await fetch(`/api/contributions?${params}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to fetch recent problems:", error);
    return [];
  }
}

/**
 * Create a contribution via the API.
 */
async function createContribution(
  input: CreateContributionInput
): Promise<InlineContribution | null> {
  try {
    const response = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create contribution");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create contribution:", error);
    return null;
  }
}

/**
 * Handle a /problem new command.
 */
async function handleProblemNew(
  parsed: ParsedCommand,
  session: SessionContext,
  context: ContributionContext
): Promise<CommandResult> {
  const contribution = await createContribution({
    sessionId: session.sessionId,
    userId: session.userId,
    problemId: session.problemId,
    command: "problem",
    subcommand: "new",
    content: parsed.content,
    timeSinceStart: Date.now() - session.startTime,
    currentAttempt: session.attemptCount,
    context,
  });

  if (!contribution) {
    return {
      success: false,
      message: "Failed to save problem contribution",
      error: "API error",
    };
  }

  return {
    success: true,
    contributionId: contribution.id,
    message: "Problem recorded! Your confusion point has been saved.",
  };
}

/**
 * Handle a /solution new command.
 */
async function handleSolutionNew(
  parsed: ParsedCommand,
  session: SessionContext,
  context: ContributionContext
): Promise<CommandResult> {
  const contribution = await createContribution({
    sessionId: session.sessionId,
    userId: session.userId,
    problemId: session.problemId,
    command: "solution",
    subcommand: "new",
    content: parsed.content,
    timeSinceStart: Date.now() - session.startTime,
    currentAttempt: session.attemptCount,
    context,
  });

  if (!contribution) {
    return {
      success: false,
      message: "Failed to save solution contribution",
      error: "API error",
    };
  }

  // Auto-link to recent problems
  const recentProblems = await fetchRecentProblems(
    session.sessionId,
    session.problemId
  );

  const candidates = generateAutoLinkCandidates(
    {
      content: parsed.content,
      problemId: session.problemId,
      sessionId: session.sessionId,
    },
    recentProblems
  );

  let linkedContributions: string[] = [];

  if (candidates.length > 0) {
    linkedContributions = await createAutoLinks(contribution.id, candidates);
  }

  const linkMessage =
    linkedContributions.length > 0
      ? ` Automatically linked to ${linkedContributions.length} recent problem(s).`
      : "";

  return {
    success: true,
    contributionId: contribution.id,
    message: `Insight recorded! Your breakthrough has been saved.${linkMessage}`,
    linkedContributions,
  };
}

/**
 * Handle a /guidance /select command.
 */
async function handleGuidanceSelect(
  parsed: ParsedCommand,
  session: SessionContext,
  context: ContributionContext
): Promise<CommandResult> {
  if (!parsed.references || parsed.references.length === 0) {
    return {
      success: false,
      message: "Guidance requires at least one reference",
      error: "Missing references",
    };
  }

  // Build references object
  const references: ContributionReferences = {
    problems: parsed.references.filter((ref) => ref.startsWith("prob_")),
    solutions: parsed.references.filter((ref) => ref.startsWith("sol_")),
  };

  // Accept any reference format for flexibility
  if (references.problems?.length === 0 && references.solutions?.length === 0) {
    // If no prefixed IDs, treat all as general references
    references.problems = parsed.references;
  }

  const contribution = await createContribution({
    sessionId: session.sessionId,
    userId: session.userId,
    problemId: session.problemId,
    command: "guidance",
    subcommand: "select",
    content: parsed.content,
    timeSinceStart: Date.now() - session.startTime,
    currentAttempt: session.attemptCount,
    context,
    references,
  });

  if (!contribution) {
    return {
      success: false,
      message: "Failed to save guidance contribution",
      error: "API error",
    };
  }

  // Create links to referenced contributions
  const linkedContributions: string[] = [];

  for (const refId of parsed.references) {
    try {
      const response = await fetch("/api/contribution-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromContributionId: contribution.id,
          toContributionId: refId,
          linkType: "references",
          autoGenerated: false,
        }),
      });

      if (response.ok) {
        const link = await response.json();
        linkedContributions.push(link.id);
      }
    } catch (error) {
      console.error("Failed to create reference link:", error);
    }
  }

  return {
    success: true,
    contributionId: contribution.id,
    message: `Guidance recorded! Linked to ${linkedContributions.length} contribution(s).`,
    linkedContributions,
  };
}

/**
 * Execute a parsed slash command.
 */
export async function executeSlashCommand(
  parsed: ParsedCommand,
  session: SessionContext,
  context: ContributionContext
): Promise<CommandResult> {
  if (!parsed.isValid) {
    return {
      success: false,
      message: parsed.error || "Invalid command",
      error: parsed.error,
    };
  }

  switch (parsed.command) {
    case "problem":
      if (parsed.subcommand === "new") {
        return handleProblemNew(parsed, session, context);
      }
      break;

    case "solution":
      if (parsed.subcommand === "new") {
        return handleSolutionNew(parsed, session, context);
      }
      break;

    case "guidance":
      if (parsed.subcommand === "select") {
        return handleGuidanceSelect(parsed, session, context);
      }
      break;
  }

  return {
    success: false,
    message: `Unknown command combination: /${parsed.command} ${parsed.subcommand}`,
    error: "Unknown command",
  };
}
