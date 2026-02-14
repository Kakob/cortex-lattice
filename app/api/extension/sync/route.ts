import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

// Types matching the extension's data structure
interface SyncPayload {
  problems: ExtProblem[];
  attempts: ExtAttempt[];
  snapshots: ExtSnapshot[];
  stuckPoints: ExtStuckPoint[];
  reflections: ExtReflection[];
  spacedRepetition: ExtSpacedRepetition[];
  reviewResults: ExtReviewResult[];
}

interface ExtProblem {
  id: string;
  platform: string;
  url: string;
  title: string;
  normalizedTitle: string;
  pattern?: string;
  difficulty?: string;
  curriculum?: { track: string; patternKey: string; index: number };
  createdAt: number;
}

interface ExtAttempt {
  id: string;
  problemId: string;
  startedAt: number;
  completedAt?: number;
  status: string;
  passed: boolean;
  snapshotCount: number;
}

interface ExtSnapshot {
  id: string;
  attemptId: string;
  timestamp: number;
  trigger: string;
  code: string;
  testResult?: string;
}

interface ExtStuckPoint {
  id: string;
  attemptId: string;
  timestamp: number;
  description: string;
  intendedAction: string;
}

interface ExtReflection {
  id: string;
  attemptId: string;
  timestamp: number;
  type: string;
  content: string;
  coldHint?: string;
  confidence?: string;
}

interface ExtSpacedRepetition {
  problemId: string;
  nextReview: number;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewed?: number;
}

interface ExtReviewResult {
  id: string;
  problemId: string;
  timestamp: number;
  passed: boolean;
  wasMultiAttempt: boolean;
  previousInterval: number;
  newInterval: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data: SyncPayload = await request.json();

    // Map extension problem IDs to database IDs
    const problemIdMap = new Map<string, string>();
    const attemptIdMap = new Map<string, string>();

    // Sync problems
    for (const problem of data.problems) {
      const existing = await prisma.studyProblem.findFirst({
        where: { odl: problem.id },
      });

      if (existing) {
        problemIdMap.set(problem.id, existing.id);
      } else {
        const created = await prisma.studyProblem.create({
          data: {
            odl: problem.id,
            userId,
            platform: problem.platform,
            url: problem.url,
            title: problem.title,
            normalizedTitle: problem.normalizedTitle,
            pattern: problem.pattern || problem.curriculum?.patternKey,
            difficulty: problem.difficulty,
            curriculumTrack: problem.curriculum?.track,
            curriculumIndex: problem.curriculum?.index,
          },
        });
        problemIdMap.set(problem.id, created.id);
      }
    }

    // Sync attempts
    for (const attempt of data.attempts) {
      const dbProblemId = problemIdMap.get(attempt.problemId);
      if (!dbProblemId) continue;

      const existing = await prisma.studyAttempt.findFirst({
        where: { odl: attempt.id },
      });

      if (existing) {
        attemptIdMap.set(attempt.id, existing.id);
        // Update if status changed
        await prisma.studyAttempt.update({
          where: { id: existing.id },
          data: {
            status: attempt.status,
            passed: attempt.passed,
            completedAt: attempt.completedAt ? new Date(attempt.completedAt) : null,
            snapshotCount: attempt.snapshotCount,
          },
        });
      } else {
        const created = await prisma.studyAttempt.create({
          data: {
            odl: attempt.id,
            problemId: dbProblemId,
            startedAt: new Date(attempt.startedAt),
            completedAt: attempt.completedAt ? new Date(attempt.completedAt) : null,
            status: attempt.status,
            passed: attempt.passed,
            snapshotCount: attempt.snapshotCount,
          },
        });
        attemptIdMap.set(attempt.id, created.id);
      }
    }

    // Sync snapshots
    for (const snapshot of data.snapshots) {
      const dbAttemptId = attemptIdMap.get(snapshot.attemptId);
      if (!dbAttemptId) continue;

      const existing = await prisma.studySnapshot.findFirst({
        where: { odl: snapshot.id },
      });

      if (!existing) {
        await prisma.studySnapshot.create({
          data: {
            odl: snapshot.id,
            attemptId: dbAttemptId,
            timestamp: new Date(snapshot.timestamp),
            trigger: snapshot.trigger,
            code: snapshot.code,
            testResult: snapshot.testResult,
          },
        });
      }
    }

    // Sync stuck points
    for (const stuck of data.stuckPoints) {
      const dbAttemptId = attemptIdMap.get(stuck.attemptId);
      if (!dbAttemptId) continue;

      const existing = await prisma.studyStuckPoint.findFirst({
        where: { odl: stuck.id },
      });

      if (!existing) {
        await prisma.studyStuckPoint.create({
          data: {
            odl: stuck.id,
            attemptId: dbAttemptId,
            timestamp: new Date(stuck.timestamp),
            description: stuck.description,
            intendedAction: stuck.intendedAction,
          },
        });
      }
    }

    // Sync reflections
    for (const reflection of data.reflections) {
      const dbAttemptId = attemptIdMap.get(reflection.attemptId);
      if (!dbAttemptId) continue;

      const existing = await prisma.studyReflection.findFirst({
        where: { odl: reflection.id },
      });

      if (!existing) {
        await prisma.studyReflection.create({
          data: {
            odl: reflection.id,
            attemptId: dbAttemptId,
            timestamp: new Date(reflection.timestamp),
            type: reflection.type,
            content: reflection.content,
            coldHint: reflection.coldHint,
            confidence: reflection.confidence,
          },
        });
      }
    }

    // Sync spaced repetition
    for (const sr of data.spacedRepetition) {
      const dbProblemId = problemIdMap.get(sr.problemId);
      if (!dbProblemId) continue;

      await prisma.studySpacedRepetition.upsert({
        where: { problemId: dbProblemId },
        create: {
          problemId: dbProblemId,
          nextReview: new Date(sr.nextReview),
          intervalDays: sr.intervalDays,
          easeFactor: sr.easeFactor,
          reviewCount: sr.reviewCount,
          lastReviewed: sr.lastReviewed ? new Date(sr.lastReviewed) : null,
        },
        update: {
          nextReview: new Date(sr.nextReview),
          intervalDays: sr.intervalDays,
          easeFactor: sr.easeFactor,
          reviewCount: sr.reviewCount,
          lastReviewed: sr.lastReviewed ? new Date(sr.lastReviewed) : null,
        },
      });
    }

    // Sync review results
    for (const result of data.reviewResults) {
      const dbProblemId = problemIdMap.get(result.problemId);
      if (!dbProblemId) continue;

      const existing = await prisma.studyReviewResult.findFirst({
        where: { odl: result.id },
      });

      if (!existing) {
        await prisma.studyReviewResult.create({
          data: {
            odl: result.id,
            problemId: dbProblemId,
            userId,
            timestamp: new Date(result.timestamp),
            passed: result.passed,
            wasMultiAttempt: result.wasMultiAttempt,
            previousInterval: result.previousInterval,
            newInterval: result.newInterval,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: {
        problems: data.problems.length,
        attempts: data.attempts.length,
        snapshots: data.snapshots.length,
        stuckPoints: data.stuckPoints.length,
        reflections: data.reflections.length,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}
