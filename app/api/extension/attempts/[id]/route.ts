/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: UPDATE ATTEMPT
 * =============================================================================
 *
 * Endpoint: PATCH /api/extension/attempts/:id
 *
 * PURPOSE:
 * --------
 * Updates an existing attempt record. Called when:
 * 1. User completes the problem (sets completedAt, status, passed)
 * 2. User abandons the problem (sets status to 'abandoned')
 * 3. Extension needs to sync updated snapshot count
 *
 * TYPICAL FLOW:
 * -------------
 * 1. User starts problem → POST /attempts (creates with status='in_progress')
 * 2. User clicks Run/Submit multiple times → POST /snapshots
 * 3. User passes all tests → PATCH /attempts/:id (status='completed', passed=true)
 * 4. OR user gives up → PATCH /attempts/:id (status='abandoned')
 *
 * AUTHORIZATION:
 * --------------
 * Unlike POST (which uses problemId), PATCH uses the attempt ID directly.
 * We verify ownership by checking that the attempt's problem belongs to
 * the authenticated user. Returns 403 if the attempt belongs to someone else.
 *
 * PARTIAL UPDATES:
 * ----------------
 * Only fields included in the request body are updated.
 * This allows updating just the status without touching completedAt, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * Request body for updating an attempt.
 * All fields are optional - only included fields are updated.
 */
interface UpdateAttemptRequest {
  /** When the attempt completed (Unix timestamp) */
  completedAt?: number;
  /** New status: 'in_progress' | 'completed' | 'abandoned' */
  status?: string;
  /** Whether the user passed all tests */
  passed?: boolean;
  /** Updated snapshot count (usually set automatically by snapshot endpoint) */
  snapshotCount?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data: UpdateAttemptRequest = await request.json();

    // FIND ATTEMPT: Includes problem to verify ownership
    const attempt = await prisma.studyAttempt.findFirst({
      where: { id },
      include: { problem: true },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // AUTHORIZATION: Verify attempt's problem belongs to this user
    // 403 Forbidden (not 404) because the attempt exists but user can't access it
    if (attempt.problem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // BUILD UPDATE OBJECT: Only include fields that were provided
    // This allows partial updates without overwriting unmentioned fields
    const updateData: {
      completedAt?: Date;
      status?: string;
      passed?: boolean;
      snapshotCount?: number;
    } = {};

    if (data.completedAt !== undefined) {
      updateData.completedAt = new Date(data.completedAt);
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.passed !== undefined) {
      updateData.passed = data.passed;
    }
    if (data.snapshotCount !== undefined) {
      updateData.snapshotCount = data.snapshotCount;
    }

    // PERFORM UPDATE
    await prisma.studyAttempt.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id,
      updated: true,
    });
  } catch (error) {
    console.error('Update attempt error:', error);
    return NextResponse.json(
      { error: 'Failed to update attempt' },
      { status: 500 }
    );
  }
}
