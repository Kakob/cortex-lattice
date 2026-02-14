/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: REVIEWS DUE
 * =============================================================================
 *
 * Endpoint: GET /api/extension/reviews-due
 *
 * PURPOSE:
 * Returns problems that are due for review (nextReview <= end of today).
 * Used by the extension to show which problems need spaced repetition review.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get end of today
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Find all spaced repetition records where review is due
    const srRecords = await prisma.studySpacedRepetition.findMany({
      where: {
        problem: { userId },
        nextReview: { lte: endOfToday },
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            url: true,
            platform: true,
            pattern: true,
            difficulty: true,
          },
        },
      },
      orderBy: { nextReview: 'asc' },
    });

    // Transform to the expected response format
    const reviews = srRecords.map((sr) => ({
      problem: sr.problem,
      sr: {
        nextReview: sr.nextReview.getTime(),
        intervalDays: sr.intervalDays,
        easeFactor: sr.easeFactor,
        reviewCount: sr.reviewCount,
      },
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Get reviews due error:', error);
    return NextResponse.json(
      { error: 'Failed to get reviews due' },
      { status: 500 }
    );
  }
}
