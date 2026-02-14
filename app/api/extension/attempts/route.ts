/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: ATTEMPTS
 * =============================================================================
 *
 * Endpoint: POST /api/extension/attempts
 *
 * PURPOSE:
 * --------
 * Creates a new attempt record when the user starts working on a problem.
 * An "attempt" represents a single problem-solving session. A problem can
 * have multiple attempts (e.g., user tries today, gives up, tries again
 * next week).
 *
 * WHAT'S TRACKED:
 * ---------------
 * - Start time (when user navigated to the problem)
 * - Completion time (when marked as complete or abandoned)
 * - Status: 'in_progress' | 'completed' | 'abandoned'
 * - Pass/fail result
 * - Snapshot count (how many Run/Submit clicks)
 *
 * IDEMPOTENCY:
 * ------------
 * Uses 'odl' field for deduplication, same as other endpoints.
 *
 * AUTHORIZATION:
 * --------------
 * Verifies that the referenced problem belongs to the authenticated user.
 * Returns 404 if problem doesn't exist or belongs to another user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/extension/attempts/current?problemId=<id>
 *
 * Returns the current in-progress attempt for a problem, or { attempt: null } if none.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const problemId = request.nextUrl.searchParams.get('problemId');
    if (!problemId) {
      return NextResponse.json({ error: 'Missing problemId parameter' }, { status: 400 });
    }

    // Verify the problem belongs to this user
    const problem = await prisma.studyProblem.findFirst({
      where: {
        id: problemId,
        userId: session.user.id,
      },
    });

    if (!problem) {
      return NextResponse.json({ attempt: null });
    }

    // Find in-progress attempt
    const attempt = await prisma.studyAttempt.findFirst({
      where: {
        problemId: problemId,
        status: 'in_progress',
      },
    });

    return NextResponse.json({ attempt: attempt || null });
  } catch (error) {
    console.error('Get current attempt error:', error);
    return NextResponse.json(
      { error: 'Failed to get attempt' },
      { status: 500 }
    );
  }
}

/**
 * Request body for creating an attempt.
 */
interface CreateAttemptRequest {
  /** Original local ID from extension (for deduplication) */
  odl: string;
  /** PostgreSQL problem ID (from createProblem response) */
  problemId: string;
  /** When the attempt started (Unix timestamp in milliseconds) */
  startedAt: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateAttemptRequest = await request.json();

    // IDEMPOTENCY CHECK: Return existing attempt if already synced
    const existing = await prisma.studyAttempt.findFirst({
      where: { odl: data.odl },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        odl: existing.odl,
        isNew: false,
      });
    }

    // AUTHORIZATION: Verify problem belongs to this user
    // This prevents users from creating attempts on other users' problems
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

    // Create new attempt record
    const attempt = await prisma.studyAttempt.create({
      data: {
        odl: data.odl,
        problemId: data.problemId,
        startedAt: new Date(data.startedAt),
        status: 'in_progress',  // Will be updated when attempt ends
        passed: false,          // Will be updated on success
        snapshotCount: 0,       // Incremented by snapshot endpoint
      },
    });

    return NextResponse.json({
      id: attempt.id,
      odl: attempt.odl,
      isNew: true,
    });
  } catch (error) {
    console.error('Create attempt error:', error);
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
}
