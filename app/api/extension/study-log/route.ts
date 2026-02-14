import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { GTCI_CURRICULUM, PATTERN_ORDER, CurriculumProblem } from '@/lib/curriculum';

interface StudyProblemWithRelations {
  id: string;
  odl: string;
  userId: string;
  platform: string;
  url: string;
  title: string;
  normalizedTitle: string;
  pattern: string | null;
  difficulty: string | null;
  curriculumTrack: string | null;
  curriculumIndex: number | null;
  createdAt: Date;
  updatedAt: Date;
  attempts: Array<{
    id: string;
    odl: string;
    problemId: string;
    startedAt: Date;
    completedAt: Date | null;
    status: string;
    passed: boolean;
    snapshotCount: number;
    createdAt: Date;
    updatedAt: Date;
    snapshots: Array<{
      id: string;
      odl: string;
      attemptId: string;
      timestamp: Date;
      trigger: string;
      code: string;
      testResult: string | null;
      createdAt: Date;
    }>;
    stuckPoints: Array<{
      id: string;
      odl: string;
      attemptId: string;
      timestamp: Date;
      description: string;
      intendedAction: string;
      createdAt: Date;
    }>;
    reflections: Array<{
      id: string;
      odl: string;
      attemptId: string;
      timestamp: Date;
      type: string;
      content: string;
      coldHint: string | null;
      confidence: string | null;
      createdAt: Date;
    }>;
  }>;
  spacedRepetition: {
    id: string;
    problemId: string;
    nextReview: Date;
    intervalDays: number;
    easeFactor: number;
    reviewCount: number;
    lastReviewed: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all user's studied problems with full details
    const studiedProblems = await prisma.studyProblem.findMany({
      where: { userId },
      include: {
        attempts: {
          include: {
            snapshots: {
              orderBy: { timestamp: 'asc' },
            },
            stuckPoints: {
              orderBy: { timestamp: 'asc' },
            },
            reflections: {
              orderBy: { timestamp: 'asc' },
            },
          },
          orderBy: { startedAt: 'asc' },
        },
        spacedRepetition: true,
      },
    });

    // Create a map of normalized title to study data
    // Support both exact and partial matches (e.g., DB may have
    // "pair-with-target-sum-easy" for curriculum "pair-with-target-sum")
    const studyDataByTitle = new Map<string, StudyProblemWithRelations>();
    for (const problem of studiedProblems) {
      studyDataByTitle.set(problem.normalizedTitle, problem);
    }

    // Build full curriculum list with study progress
    const curriculumWithProgress = GTCI_CURRICULUM.map(cp => {
      let studyData = studyDataByTitle.get(cp.normalizedTitle);

      // Fallback: find study data where DB title starts with curriculum title
      if (!studyData) {
        for (const [title, data] of studyDataByTitle) {
          if (title.startsWith(cp.normalizedTitle)) {
            studyData = data;
            break;
          }
        }
      }

      return {
        // Curriculum info
        curriculumTitle: cp.title,
        normalizedTitle: cp.normalizedTitle,
        difficulty: cp.difficulty,
        patternKey: cp.patternKey,
        index: cp.index,

        // Study progress (null if not started)
        studyData: studyData ? {
          id: studyData.id,
          platform: studyData.platform,
          url: studyData.url,
          title: studyData.title,
          attempts: studyData.attempts.map(a => ({
            id: a.id,
            startedAt: a.startedAt,
            completedAt: a.completedAt,
            status: a.status,
            passed: a.passed,
            snapshotCount: a.snapshotCount,
            snapshots: a.snapshots.map(s => ({
              id: s.id,
              timestamp: s.timestamp,
              trigger: s.trigger,
              code: s.code,
              testResult: s.testResult,
            })),
            stuckPoints: a.stuckPoints.map(sp => ({
              id: sp.id,
              timestamp: sp.timestamp,
              description: sp.description,
              intendedAction: sp.intendedAction,
            })),
            reflections: a.reflections.map(r => ({
              id: r.id,
              timestamp: r.timestamp,
              type: r.type,
              content: r.content,
              coldHint: r.coldHint,
              confidence: r.confidence,
            })),
          })),
          spacedRepetition: studyData.spacedRepetition ? {
            nextReview: studyData.spacedRepetition.nextReview,
            intervalDays: studyData.spacedRepetition.intervalDays,
            easeFactor: studyData.spacedRepetition.easeFactor,
            reviewCount: studyData.spacedRepetition.reviewCount,
          } : null,
        } : null,
      };
    });

    // Group by pattern in display order
    const problemsByPattern: Record<string, typeof curriculumWithProgress> = {};
    for (const pattern of PATTERN_ORDER) {
      problemsByPattern[pattern] = curriculumWithProgress
        .filter(p => p.patternKey === pattern)
        .sort((a, b) => a.index - b.index);
    }

    // Calculate stats
    const totalCurriculumProblems = GTCI_CURRICULUM.length;
    const startedProblems = curriculumWithProgress.filter(p => p.studyData !== null).length;
    const solvedProblems = curriculumWithProgress.filter(p =>
      p.studyData?.attempts.some(a => a.passed)
    ).length;

    const coldSolves = curriculumWithProgress.filter(p => {
      if (!p.studyData) return false;
      const firstAttempt = p.studyData.attempts[0];
      return firstAttempt?.passed && firstAttempt?.snapshotCount <= 1;
    }).length;

    const reviewsDue = curriculumWithProgress.filter(p =>
      p.studyData?.spacedRepetition &&
      new Date(p.studyData.spacedRepetition.nextReview) <= new Date()
    ).length;

    return NextResponse.json({
      stats: {
        totalCurriculumProblems,
        startedProblems,
        solvedProblems,
        coldSolves,
        coldSolveRate: solvedProblems > 0 ? coldSolves / solvedProblems : 0,
        reviewsDue,
      },
      problemsByPattern,
      patternOrder: PATTERN_ORDER,
    });
  } catch (error) {
    console.error('Study log error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study log' },
      { status: 500 }
    );
  }
}
