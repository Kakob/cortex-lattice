/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: SNAPSHOTS
 * =============================================================================
 *
 * Endpoint: POST /api/extension/snapshots
 *
 * PURPOSE:
 * --------
 * Captures a code snapshot every time the user clicks Run or Submit.
 * This creates a detailed timeline of the problem-solving process.
 *
 * WHY SNAPSHOTS MATTER:
 * ---------------------
 * 1. Learning Analytics: See how code evolves from first attempt to solution
 * 2. Debugging History: Review what was tried when stuck
 * 3. Progress Tracking: Count of snapshots indicates effort level
 * 4. Spaced Repetition: More attempts = different interval scheduling
 *
 * DATA CAPTURED:
 * --------------
 * - timestamp: When the Run/Submit was clicked
 * - trigger: 'run' (local tests) or 'submit' (full test suite)
 * - code: Complete code content at that moment
 * - testResult: 'pass' | 'fail' | 'error' (if available)
 *
 * SIDE EFFECTS:
 * -------------
 * Increments the snapshotCount on the parent attempt record.
 * This count is used by the spaced repetition algorithm:
 * - 1 snapshot (first-try solve) = longer initial interval
 * - Many snapshots (struggled) = shorter initial interval
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * Request body for creating a snapshot.
 */
interface CreateSnapshotRequest {
  /** Original local ID from extension (for deduplication) */
  odl: string;
  /** PostgreSQL attempt ID (from createAttempt response) */
  attemptId: string;
  /** When the snapshot was taken (Unix timestamp) */
  timestamp: number;
  /** What triggered the snapshot: 'run' | 'submit' */
  trigger: string;
  /** The complete code at this moment */
  code: string;
  /** Test result if available: 'pass' | 'fail' | 'error' */
  testResult?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateSnapshotRequest = await request.json();

    // IDEMPOTENCY CHECK: Return existing snapshot if already synced
    const existing = await prisma.studySnapshot.findFirst({
      where: { odl: data.odl },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        odl: existing.odl,
      });
    }

    // AUTHORIZATION: Verify attempt belongs to this user
    // We need to traverse the relation: attempt -> problem -> user
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

    // Create the snapshot record
    const snapshot = await prisma.studySnapshot.create({
      data: {
        odl: data.odl,
        attemptId: data.attemptId,
        timestamp: new Date(data.timestamp),
        trigger: data.trigger,
        code: data.code,
        testResult: data.testResult,
      },
    });

    // SIDE EFFECT: Increment snapshot count on the attempt
    // This tracks how many Run/Submit clicks occurred
    await prisma.studyAttempt.update({
      where: { id: data.attemptId },
      data: { snapshotCount: { increment: 1 } },
    });

    return NextResponse.json({
      id: snapshot.id,
      odl: snapshot.odl,
    });
  } catch (error) {
    console.error('Create snapshot error:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}
