/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: PROBLEMS
 * =============================================================================
 *
 * Endpoint: POST /api/extension/problems
 *
 * PURPOSE:
 * --------
 * Creates a new problem record when the user navigates to a LeetCode or
 * DesignGurus problem page. This is typically the first API call made
 * when tracking begins for a new problem.
 *
 * IDEMPOTENCY:
 * ------------
 * This endpoint is idempotent via the 'odl' (Original Device Local ID) field.
 * If a problem with the same odl already exists, we return the existing
 * record instead of creating a duplicate. This allows the extension to
 * safely retry failed syncs.
 *
 * FLOW:
 * -----
 * 1. Extension detects user on a problem page (e.g., leetcode.com/problems/two-sum)
 * 2. Extension scrapes problem info (title, difficulty, URL)
 * 3. Extension calls this endpoint to register the problem
 * 4. Returns the PostgreSQL ID for use in subsequent API calls
 *
 * AUTHENTICATION:
 * ---------------
 * Requires the user to be logged into the web app (cookie-based auth).
 * Returns 401 if not authenticated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/extension/problems?url=<encoded_url>
 *
 * Returns the problem matching the given URL, or { problem: null } if not found.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const problem = await prisma.studyProblem.findFirst({
      where: {
        userId: session.user.id,
        url: url,
      },
    });

    return NextResponse.json({ problem: problem || null });
  } catch (error) {
    console.error('Get problem by URL error:', error);
    return NextResponse.json(
      { error: 'Failed to get problem' },
      { status: 500 }
    );
  }
}

/**
 * Request body for creating a problem.
 */
interface CreateProblemRequest {
  /** Original local ID from extension (for deduplication) */
  odl: string;
  /** Platform identifier: 'leetcode' | 'grokking' */
  platform: string;
  /** Full URL of the problem page */
  url: string;
  /** Problem title as displayed on the page */
  title: string;
  /** Normalized title for matching (lowercase, no special chars) */
  normalizedTitle: string;
  /** Algorithmic pattern (e.g., 'two-pointers', 'sliding-window') */
  pattern?: string;
  /** Difficulty level: 'easy' | 'medium' | 'hard' */
  difficulty?: string;
  /** GTCI curriculum track (e.g., 'gtci') */
  curriculumTrack?: string;
  /** Index within the curriculum track */
  curriculumIndex?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated via NextAuth session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data: CreateProblemRequest = await request.json();

    // IDEMPOTENCY CHECK: If problem with this odl exists, return it
    // This allows the extension to retry failed syncs safely
    const existing = await prisma.studyProblem.findFirst({
      where: { odl: data.odl },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        odl: existing.odl,
        isNew: false,  // Indicates this was an existing record
      });
    }

    // Create new problem record
    const problem = await prisma.studyProblem.create({
      data: {
        odl: data.odl,
        userId,
        platform: data.platform,
        url: data.url,
        title: data.title,
        normalizedTitle: data.normalizedTitle,
        pattern: data.pattern,
        difficulty: data.difficulty,
        curriculumTrack: data.curriculumTrack,
        curriculumIndex: data.curriculumIndex,
      },
    });

    return NextResponse.json({
      id: problem.id,    // PostgreSQL ID for subsequent API calls
      odl: problem.odl,  // Echo back for confirmation
      isNew: true,       // Indicates this was newly created
    });
  } catch (error) {
    console.error('Create problem error:', error);
    return NextResponse.json(
      { error: 'Failed to create problem' },
      { status: 500 }
    );
  }
}
