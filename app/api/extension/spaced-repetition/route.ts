/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: SPACED REPETITION
 * =============================================================================
 *
 * Endpoint: POST /api/extension/spaced-repetition
 *
 * PURPOSE:
 * --------
 * Manages the spaced repetition schedule for each problem. This is the core
 * of the long-term retention system - ensuring users review problems at
 * optimal intervals to maximize learning retention.
 *
 * HOW SPACED REPETITION WORKS:
 * ----------------------------
 * 1. User solves a problem for the first time
 * 2. Extension calculates initial interval based on performance
 * 3. Problem is scheduled for review (e.g., in 3 days)
 * 4. When user reviews, interval is adjusted based on success/failure
 * 5. Intervals grow exponentially on success: 1d → 3d → 7d → 14d → 30d → ...
 * 6. Intervals reset on failure (back to hours)
 *
 * THE SM-2 ALGORITHM (Modified):
 * ------------------------------
 * We use a modified version of the SuperMemo SM-2 algorithm:
 *
 * nextInterval = currentInterval × multiplier × easeFactor
 *
 * Where:
 * - multiplier depends on how you solved it (cold solve = 2.0, with AI = 1.2)
 * - easeFactor adjusts based on history (easier problems grow faster)
 *
 * EASE FACTOR:
 * ------------
 * The ease factor (1.3 to 2.5) represents how "easy" this problem is for you:
 * - Higher ease = intervals grow faster (you know this well)
 * - Lower ease = intervals grow slower (you struggle with this)
 * - Adjusted +0.1 on cold solve, -0.1 on AI usage, -0.2 on failure
 *
 * UPSERT SEMANTICS:
 * -----------------
 * Unlike other endpoints that use 'odl' for idempotency, this endpoint uses
 * Prisma's upsert: create if not exists, update if exists.
 * This is because there's exactly one spaced repetition record per problem.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * Request body for upserting spaced repetition data.
 */
interface UpsertSpacedRepetitionRequest {
  /** PostgreSQL problem ID */
  problemId: string;
  /** When the next review is due (Unix timestamp) */
  nextReview: number;
  /** Current interval in days (can be fractional, e.g., 0.5 = 12 hours) */
  intervalDays: number;
  /** SM-2 ease factor (1.3 to 2.5) */
  easeFactor: number;
  /** Total number of reviews completed */
  reviewCount: number;
  /** When the problem was last reviewed (Unix timestamp, optional) */
  lastReviewed?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: UpsertSpacedRepetitionRequest = await request.json();

    // AUTHORIZATION: Verify problem belongs to this user
    const problem = await prisma.studyProblem.findFirst({
      where: {
        id: data.problemId,
        userId: session.user.id,
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // UPSERT: Create if doesn't exist, update if it does
    // There's exactly one spaced repetition record per problem
    const sr = await prisma.studySpacedRepetition.upsert({
      where: { problemId: data.problemId },
      create: {
        problemId: data.problemId,
        nextReview: new Date(data.nextReview),
        intervalDays: data.intervalDays,
        easeFactor: data.easeFactor,
        reviewCount: data.reviewCount,
        lastReviewed: data.lastReviewed ? new Date(data.lastReviewed) : null,
      },
      update: {
        nextReview: new Date(data.nextReview),
        intervalDays: data.intervalDays,
        easeFactor: data.easeFactor,
        reviewCount: data.reviewCount,
        lastReviewed: data.lastReviewed ? new Date(data.lastReviewed) : null,
      },
    });

    return NextResponse.json({
      id: sr.id,
      // isNew: true if this record was just created (timestamps match)
      isNew: sr.createdAt.getTime() === sr.updatedAt.getTime(),
    });
  } catch (error) {
    console.error('Upsert spaced repetition error:', error);
    return NextResponse.json(
      { error: 'Failed to upsert spaced repetition' },
      { status: 500 }
    );
  }
}
