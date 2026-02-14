/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: STUCK POINTS
 * =============================================================================
 *
 * Endpoint: POST /api/extension/stuck-points
 *
 * PURPOSE:
 * --------
 * Records when the user acknowledges being stuck on a problem.
 * This is triggered by the keyboard shortcut (Ctrl+Shift+L) which opens
 * a modal asking "What are you stuck on?" and "What do you plan to do?"
 *
 * WHY THIS MATTERS:
 * -----------------
 * 1. Self-Awareness: Explicitly acknowledging being stuck helps learning
 * 2. Decision Tracking: Records what help they chose (hint, AI, solution)
 * 3. Spaced Repetition: Using help = shorter review intervals
 * 4. Analytics: Identify common sticking points across problems/patterns
 *
 * INTENDED ACTIONS:
 * -----------------
 * - 'think_more': User will keep trying without help
 * - 'check_hint': User will reveal a hint
 * - 'ask_ai': User will use AI assistance (ChatGPT, Copilot, etc.)
 * - 'view_solution': User will look at the solution
 *
 * The intended action affects future spaced repetition intervals:
 * - think_more: No penalty (good effort)
 * - check_hint: 1.5x multiplier instead of 2.0x
 * - ask_ai: 1.2x multiplier (significant help)
 * - view_solution: Reset to 4 hours (didn't really learn it)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * Request body for creating a stuck point.
 */
interface CreateStuckPointRequest {
  /** Original local ID from extension (for deduplication) */
  odl: string;
  /** PostgreSQL attempt ID (from createAttempt response) */
  attemptId: string;
  /** When the stuck point was logged (Unix timestamp) */
  timestamp: number;
  /** What the user is stuck on (free text) */
  description: string;
  /** Code at the time of this stuck point */
  codeSnapshot?: string;
  /** What they plan to do next: 'think_more' | 'check_hint' | 'ask_ai' | 'view_solution' */
  intendedAction: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateStuckPointRequest = await request.json();

    // IDEMPOTENCY CHECK: Return existing stuck point if already synced
    const existing = await prisma.studyStuckPoint.findFirst({
      where: { odl: data.odl },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        odl: existing.odl,
      });
    }

    // AUTHORIZATION: Verify attempt belongs to this user
    const attempt = await prisma.studyAttempt.findFirst({
      where: { id: data.attemptId },
      include: { problem: true },
    });

    if (!attempt || attempt.problem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Create the stuck point record
    const stuckPoint = await prisma.studyStuckPoint.create({
      data: {
        odl: data.odl,
        attemptId: data.attemptId,
        timestamp: new Date(data.timestamp),
        description: data.description,
        codeSnapshot: data.codeSnapshot,
        intendedAction: data.intendedAction,
      },
    });

    return NextResponse.json({
      id: stuckPoint.id,
      odl: stuckPoint.odl,
    });
  } catch (error) {
    console.error('Create stuck point error:', error);
    return NextResponse.json(
      { error: 'Failed to create stuck point' },
      { status: 500 }
    );
  }
}
