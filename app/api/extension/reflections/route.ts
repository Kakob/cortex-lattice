/**
 * =============================================================================
 * CORTEX LATTICE - EXTENSION API: REFLECTIONS
 * =============================================================================
 *
 * Endpoint: POST /api/extension/reflections
 *
 * PURPOSE:
 * --------
 * Records the user's thoughts, insights, and self-assessments during or after
 * problem-solving. Reflections are a key part of metacognitive learning.
 *
 * REFLECTION TYPES:
 * -----------------
 * - 'thought': General observation during problem-solving
 *   "I think I need to track two pointers..."
 *
 * - 'aha': Breakthrough moment, sudden insight
 *   "Oh! I need to sort first so the two-pointer approach works!"
 *
 * - 'stuck': What they're struggling with (similar to stuck points but more freeform)
 *   "I don't understand why my edge case is failing..."
 *
 * - 'post_solve': Reflection after completing the problem
 *   "The key insight was realizing this is really a two-pointer problem in disguise"
 *
 * COLD HINTS:
 * -----------
 * The 'coldHint' field lets users write a hint for their future self.
 * When they review this problem later via spaced repetition, this hint
 * is shown to help them recall the approach without giving away the solution.
 *
 * CONFIDENCE:
 * -----------
 * After solving, users self-assess their confidence:
 * - 'easy': "I could do this in my sleep"
 * - 'moderate': "Had to think but got it"
 * - 'lucky': "Not sure I could do it again"
 *
 * Confidence affects the initial spaced repetition interval:
 * - easy: 4 days
 * - moderate: 3 days
 * - lucky: 1 day
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * Request body for creating a reflection.
 */
interface CreateReflectionRequest {
  /** Original local ID from extension (for deduplication) */
  odl: string;
  /** PostgreSQL attempt ID (from createAttempt response) */
  attemptId: string;
  /** When the reflection was recorded (Unix timestamp) */
  timestamp: number;
  /** Type of reflection: 'thought' | 'aha' | 'stuck' | 'post_solve' */
  type: string;
  /** The reflection content (free text) */
  content: string;
  /** Code at the time of this reflection */
  codeSnapshot?: string;
  /** Hint for future review (shown during spaced repetition) */
  coldHint?: string;
  /** Self-assessed confidence: 'easy' | 'moderate' | 'lucky' */
  confidence?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateReflectionRequest = await request.json();

    // IDEMPOTENCY CHECK: Return existing reflection if already synced
    const existing = await prisma.studyReflection.findFirst({
      where: { odl: data.odl },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        odl: existing.odl,
      });
    }

    // AUTHORIZATION: Verify attempt belongs to this user
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

    // Create the reflection record
    const reflection = await prisma.studyReflection.create({
      data: {
        odl: data.odl,
        attemptId: data.attemptId,
        timestamp: new Date(data.timestamp),
        type: data.type,
        content: data.content,
        codeSnapshot: data.codeSnapshot,
        coldHint: data.coldHint,
        confidence: data.confidence,
      },
    });

    return NextResponse.json({
      id: reflection.id,
      odl: reflection.odl,
    });
  } catch (error) {
    console.error('Create reflection error:', error);
    return NextResponse.json(
      { error: 'Failed to create reflection' },
      { status: 500 }
    );
  }
}
