/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: STATS
 * =============================================================================
 *
 * Endpoint: GET /api/extension/stats
 *
 * PURPOSE:
 * Returns aggregate statistics for the user's study progress.
 * Used by the extension popup to display a quick overview.
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

    // Get total problems count
    const totalProblems = await prisma.studyProblem.count({
      where: { userId },
    });

    // Get total attempts count
    const totalAttempts = await prisma.studyAttempt.count({
      where: {
        problem: { userId },
      },
    });

    // Calculate cold solve count (first attempt passed with snapshotCount <= 1)
    // We need to find problems where the first attempt was successful without multiple submissions
    const problems = await prisma.studyProblem.findMany({
      where: { userId },
      include: {
        attempts: {
          orderBy: { startedAt: 'asc' },
          take: 1,
        },
      },
    });

    const coldSolveCount = problems.filter(
      (p) => p.attempts[0]?.passed && p.attempts[0]?.snapshotCount <= 1
    ).length;

    const coldSolveRate = totalProblems > 0 ? coldSolveCount / totalProblems : 0;

    // Get reviews due today (nextReview <= end of today)
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const reviewsDueToday = await prisma.studySpacedRepetition.count({
      where: {
        problem: { userId },
        nextReview: { lte: endOfToday },
      },
    });

    // Calculate current streak (consecutive days with completed attempts)
    const currentStreak = await calculateStreak(userId);

    return NextResponse.json({
      totalProblems,
      totalAttempts,
      coldSolveCount,
      coldSolveRate,
      reviewsDueToday,
      currentStreak,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}

async function calculateStreak(userId: string): Promise<number> {
  // Get all completed attempts for this user, ordered by completion time
  const attempts = await prisma.studyAttempt.findMany({
    where: {
      problem: { userId },
      status: 'completed',
      completedAt: { not: null },
    },
    select: {
      completedAt: true,
    },
    orderBy: { completedAt: 'desc' },
  });

  if (attempts.length === 0) return 0;

  // Get unique dates with activity
  const activityDates = new Set<string>();
  for (const attempt of attempts) {
    if (attempt.completedAt) {
      activityDates.add(attempt.completedAt.toDateString());
    }
  }

  // Count consecutive days from today backwards
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);

    if (activityDates.has(checkDate.toDateString())) {
      streak++;
    } else if (i > 0) {
      // Allow today to not have activity yet
      break;
    }
  }

  return streak;
}
