import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { GTCI_CURRICULUM } from '@/lib/curriculum';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ normalizedTitle: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { normalizedTitle } = await params;

    // Find curriculum info (always available)
    const curriculum = GTCI_CURRICULUM.find(
      (p) => p.normalizedTitle === normalizedTitle
    );

    if (!curriculum) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Find study data (may not exist yet)
    // Try exact match first, then partial match for cases where the extension
    // stored a title with difficulty suffix (e.g., "pair-with-target-sum-easy"
    // instead of "pair-with-target-sum")
    let studyProblem = await prisma.studyProblem.findFirst({
      where: {
        userId: session.user.id,
        normalizedTitle,
      },
      include: {
        attempts: {
          include: {
            snapshots: { orderBy: { timestamp: 'asc' } },
            stuckPoints: { orderBy: { timestamp: 'asc' } },
            reflections: { orderBy: { timestamp: 'asc' } },
          },
          orderBy: { startedAt: 'asc' },
        },
        spacedRepetition: true,
      },
    });

    // Fallback: try partial match (handles legacy data with difficulty suffix)
    if (!studyProblem) {
      studyProblem = await prisma.studyProblem.findFirst({
        where: {
          userId: session.user.id,
          normalizedTitle: { startsWith: normalizedTitle },
        },
        include: {
          attempts: {
            include: {
              snapshots: { orderBy: { timestamp: 'asc' } },
              stuckPoints: { orderBy: { timestamp: 'asc' } },
              reflections: { orderBy: { timestamp: 'asc' } },
            },
            orderBy: { startedAt: 'asc' },
          },
          spacedRepetition: true,
        },
      });
    }

    return NextResponse.json({
      curriculum: {
        title: curriculum.title,
        normalizedTitle: curriculum.normalizedTitle,
        difficulty: curriculum.difficulty,
        patternKey: curriculum.patternKey,
        index: curriculum.index,
      },
      studyData: studyProblem
        ? {
            id: studyProblem.id,
            platform: studyProblem.platform,
            url: studyProblem.url,
            title: studyProblem.title,
            createdAt: studyProblem.createdAt,
            attempts: studyProblem.attempts.map((a) => ({
              id: a.id,
              startedAt: a.startedAt,
              completedAt: a.completedAt,
              status: a.status,
              passed: a.passed,
              snapshotCount: a.snapshotCount,
              snapshots: a.snapshots.map((s) => ({
                id: s.id,
                timestamp: s.timestamp,
                trigger: s.trigger,
                code: s.code,
                testResult: s.testResult,
              })),
              stuckPoints: a.stuckPoints.map((sp) => ({
                id: sp.id,
                timestamp: sp.timestamp,
                description: sp.description,
                codeSnapshot: sp.codeSnapshot,
                intendedAction: sp.intendedAction,
              })),
              reflections: a.reflections.map((r) => ({
                id: r.id,
                timestamp: r.timestamp,
                type: r.type,
                content: r.content,
                codeSnapshot: r.codeSnapshot,
                coldHint: r.coldHint,
                confidence: r.confidence,
              })),
            })),
            spacedRepetition: studyProblem.spacedRepetition
              ? {
                  nextReview: studyProblem.spacedRepetition.nextReview,
                  intervalDays: studyProblem.spacedRepetition.intervalDays,
                  easeFactor: studyProblem.spacedRepetition.easeFactor,
                  reviewCount: studyProblem.spacedRepetition.reviewCount,
                  lastReviewed: studyProblem.spacedRepetition.lastReviewed,
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error('Study log detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problem detail' },
      { status: 500 }
    );
  }
}
