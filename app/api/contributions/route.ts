/**
 * Contributions API
 *
 * POST /api/contributions - Create a new contribution
 * GET /api/contributions - List contributions with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import type {
  CreateContributionInput,
  InlineContribution,
  ContributionContext,
  ContributionReferences,
} from "@/lib/types";

/**
 * Create a new contribution from a slash command.
 */
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

    const body: CreateContributionInput = await request.json();

    // Validate required fields (userId comes from session)
    if (!body.sessionId || !body.problemId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, problemId" },
        { status: 400 }
      );
    }

    if (!body.command || !body.subcommand || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: command, subcommand, content" },
        { status: 400 }
      );
    }

    // Validate command type
    const validCommands = ["problem", "solution", "guidance"];
    if (!validCommands.includes(body.command)) {
      return NextResponse.json(
        { error: `Invalid command: ${body.command}. Must be one of: ${validCommands.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate subcommand type
    const validSubcommands = ["new", "list", "edit", "link", "select"];
    if (!validSubcommands.includes(body.subcommand)) {
      return NextResponse.json(
        { error: `Invalid subcommand: ${body.subcommand}. Must be one of: ${validSubcommands.join(", ")}` },
        { status: 400 }
      );
    }

    // Create the contribution (use authenticated user's ID)
    const contribution = await prisma.inlineContribution.create({
      data: {
        sessionId: body.sessionId,
        userId: session.user.id,
        problemId: body.problemId,
        command: body.command,
        subcommand: body.subcommand,
        content: body.content,
        timeSinceStart: body.timeSinceStart,
        currentAttempt: body.currentAttempt,
        context: body.context as object,
        references: body.references as object | undefined,
      },
    });

    // Transform to API response format
    const response: InlineContribution = {
      id: contribution.id,
      sessionId: contribution.sessionId,
      userId: contribution.userId,
      problemId: contribution.problemId,
      command: contribution.command as InlineContribution["command"],
      subcommand: contribution.subcommand as InlineContribution["subcommand"],
      content: contribution.content,
      timestamp: contribution.timestamp.toISOString(),
      timeSinceStart: contribution.timeSinceStart ?? undefined,
      currentAttempt: contribution.currentAttempt ?? undefined,
      context: contribution.context as unknown as ContributionContext,
      references: contribution.references as unknown as ContributionReferences | undefined,
      suggestedCategory: contribution.suggestedCategory ?? undefined,
      relatedPattern: contribution.relatedPattern ?? undefined,
      relatedInvariant: contribution.relatedInvariant ?? undefined,
      helpfulVotes: contribution.helpfulVotes,
      usedInGuidance: contribution.usedInGuidance,
      createdAt: contribution.createdAt.toISOString(),
      updatedAt: contribution.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create contribution:", error);
    return NextResponse.json(
      { error: "Failed to create contribution" },
      { status: 500 }
    );
  }
}

/**
 * List contributions with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");
    const problemId = searchParams.get("problemId");
    const command = searchParams.get("command");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build filter conditions
    const where: {
      sessionId?: string;
      userId?: string;
      problemId?: string;
      command?: string;
    } = {};

    if (sessionId) where.sessionId = sessionId;
    if (userId) where.userId = userId;
    if (problemId) where.problemId = problemId;
    if (command) where.command = command;

    // Query contributions
    const contributions = await prisma.inlineContribution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100), // Cap at 100
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.inlineContribution.count({ where });

    // Transform to API response format
    const items: InlineContribution[] = contributions.map((c) => ({
      id: c.id,
      sessionId: c.sessionId,
      userId: c.userId,
      problemId: c.problemId,
      command: c.command as InlineContribution["command"],
      subcommand: c.subcommand as InlineContribution["subcommand"],
      content: c.content,
      timestamp: c.timestamp.toISOString(),
      timeSinceStart: c.timeSinceStart ?? undefined,
      currentAttempt: c.currentAttempt ?? undefined,
      context: c.context as unknown as ContributionContext,
      references: c.references as unknown as ContributionReferences | undefined,
      suggestedCategory: c.suggestedCategory ?? undefined,
      relatedPattern: c.relatedPattern ?? undefined,
      relatedInvariant: c.relatedInvariant ?? undefined,
      helpfulVotes: c.helpfulVotes,
      usedInGuidance: c.usedInGuidance,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      items,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to list contributions:", error);
    return NextResponse.json(
      { error: "Failed to list contributions" },
      { status: 500 }
    );
  }
}
