/**
 * =============================================================================
 * CORTEX LATTICE - DATABASE OPERATIONS (API-Only)
 * =============================================================================
 *
 * This module provides all data operations for the extension.
 * All data is stored in PostgreSQL via the web app's API.
 * There is no local storage - the API is the single source of truth.
 *
 * ARCHITECTURE:
 * Extension → This Module → Web App API → PostgreSQL
 */

import type {
  Problem,
  Attempt,
  Snapshot,
  StuckPoint,
  Reflection,
  Platform,
  Difficulty,
  SnapshotTrigger,
  TestResult,
  IntendedAction,
  ReflectionType,
  Confidence,
} from '../types';
import { normalizeTitle, matchCurriculum } from './curriculum';
import {
  apiRequest,
  createProblem as apiCreateProblem,
  createAttempt as apiCreateAttempt,
  updateAttempt as apiUpdateAttempt,
  createSnapshot as apiCreateSnapshot,
  createStuckPoint as apiCreateStuckPoint,
  createReflection as apiCreateReflection,
  upsertSpacedRepetition as apiUpsertSpacedRepetition,
} from '../utils/api';
import { calculateInitialInterval, calculateNextInterval } from '../utils/spaced-repetition';

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a unique ID for API requests.
 * Format: timestamp-randomstring (e.g., "1706793600000-k9x2m4pq1")
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// IN-MEMORY CACHE FOR SESSION STATE
// =============================================================================

// Cache server IDs we receive back from API calls during this session
const serverIdCache = new Map<string, string>();

function cacheServerId(localId: string, serverId: string): void {
  serverIdCache.set(localId, serverId);
}

function getServerId(localId: string): string | undefined {
  return serverIdCache.get(localId);
}

// =============================================================================
// PROBLEM OPERATIONS
// =============================================================================

/**
 * Get a problem by URL from the API.
 */
export async function getProblemByUrl(url: string): Promise<Problem | null> {
  const res = await apiRequest<{ problem: Problem | null }>(
    `/api/extension/problems?url=${encodeURIComponent(url)}`,
    'GET'
  );
  return res.data?.problem ?? null;
}

/**
 * Get or create a problem. If it already exists by URL, return it.
 * Otherwise create a new one.
 */
export async function getOrCreateProblem(
  url: string,
  title: string,
  platform: Platform,
  difficulty?: Difficulty
): Promise<Problem | null> {
  // Check if problem already exists
  const existing = await getProblemByUrl(url);
  if (existing) {
    // Cache the server ID for this session
    cacheServerId(existing.id, existing.id);
    return existing;
  }

  // Create new problem
  const rawNormalizedTitle = normalizeTitle(title);
  const curriculum = matchCurriculum(rawNormalizedTitle);
  // Use the curriculum's canonical normalizedTitle when matched (e.g., scraped
  // "Pair with Target Sum (easy)" normalizes to "pair-with-target-sum-easy",
  // but curriculum expects "pair-with-target-sum")
  const normalizedTitle = curriculum?.normalizedTitle ?? rawNormalizedTitle;
  const localId = generateId();

  const response = await apiCreateProblem({
    odl: localId,
    platform,
    url,
    title,
    normalizedTitle,
    pattern: curriculum?.patternKey,
    difficulty,
    curriculumTrack: curriculum?.track,
    curriculumIndex: curriculum?.index,
  });

  if (response.success && response.data) {
    cacheServerId(localId, response.data.id);

    // Return a Problem-shaped object
    return {
      id: response.data.id,
      platform,
      url,
      title,
      normalizedTitle,
      pattern: curriculum?.patternKey,
      difficulty,
      curriculum,
      createdAt: Date.now(),
    };
  }

  console.error('Cortex Lattice: Failed to create problem:', response.error);
  return null;
}

// =============================================================================
// ATTEMPT OPERATIONS
// =============================================================================

/**
 * Get the current in-progress attempt for a problem.
 */
export async function getCurrentAttempt(problemId: string): Promise<Attempt | null> {
  const res = await apiRequest<{ attempt: Attempt | null }>(
    `/api/extension/attempts?problemId=${encodeURIComponent(problemId)}`,
    'GET'
  );

  if (res.data?.attempt) {
    cacheServerId(res.data.attempt.id, res.data.attempt.id);
  }

  return res.data?.attempt ?? null;
}

/**
 * Start a new attempt for a problem.
 */
export async function startAttempt(problemId: string): Promise<Attempt | null> {
  // Check for existing in-progress attempt first
  const existing = await getCurrentAttempt(problemId);
  if (existing) {
    return existing;
  }

  const localId = generateId();
  const startedAt = Date.now();

  const response = await apiCreateAttempt({
    odl: localId,
    problemId,
    startedAt,
  });

  if (response.success && response.data) {
    cacheServerId(localId, response.data.id);

    return {
      id: response.data.id,
      problemId,
      startedAt,
      status: 'in_progress',
      passed: false,
      snapshotCount: 0,
    };
  }

  console.error('Cortex Lattice: Failed to start attempt:', response.error);
  return null;
}

/**
 * End an attempt (mark as completed).
 */
export async function endAttempt(attemptId: string, passed: boolean): Promise<Attempt | null> {
  const completedAt = Date.now();

  const response = await apiUpdateAttempt(attemptId, {
    completedAt,
    status: 'completed',
    passed,
  });

  if (response.success) {
    return {
      id: attemptId,
      problemId: '', // We don't have this from the response
      startedAt: 0,
      completedAt,
      status: 'completed',
      passed,
      snapshotCount: 0,
    };
  }

  console.error('Cortex Lattice: Failed to end attempt:', response.error);
  return null;
}

// =============================================================================
// SNAPSHOT OPERATIONS
// =============================================================================

/**
 * Save a code snapshot.
 */
export async function saveSnapshot(
  attemptId: string,
  trigger: SnapshotTrigger,
  code: string,
  testResult?: TestResult
): Promise<Snapshot | null> {
  const localId = generateId();
  const timestamp = Date.now();

  const response = await apiCreateSnapshot({
    odl: localId,
    attemptId,
    timestamp,
    trigger,
    code,
    testResult,
  });

  if (response.success && response.data) {
    return {
      id: response.data.id,
      attemptId,
      timestamp,
      trigger,
      code,
      testResult,
    };
  }

  console.error('Cortex Lattice: Failed to save snapshot:', response.error);
  return null;
}

// =============================================================================
// STUCK POINT OPERATIONS
// =============================================================================

/**
 * Record a stuck point.
 */
export async function addStuckPoint(
  attemptId: string,
  description: string,
  intendedAction: IntendedAction,
  codeSnapshot?: string
): Promise<StuckPoint | null> {
  const localId = generateId();
  const timestamp = Date.now();

  const response = await apiCreateStuckPoint({
    odl: localId,
    attemptId,
    timestamp,
    description,
    intendedAction,
    codeSnapshot,
  });

  if (response.success && response.data) {
    return {
      id: response.data.id,
      attemptId,
      timestamp,
      description,
      intendedAction,
    };
  }

  console.error('Cortex Lattice: Failed to add stuck point:', response.error);
  return null;
}

// =============================================================================
// REFLECTION OPERATIONS
// =============================================================================

/**
 * Add a reflection.
 */
export async function addReflection(
  attemptId: string,
  type: ReflectionType,
  content: string,
  coldHint?: string,
  confidence?: Confidence,
  codeSnapshot?: string
): Promise<Reflection | null> {
  const localId = generateId();
  const timestamp = Date.now();

  const response = await apiCreateReflection({
    odl: localId,
    attemptId,
    timestamp,
    type,
    content,
    coldHint,
    confidence,
    codeSnapshot,
  });

  if (response.success && response.data) {
    return {
      id: response.data.id,
      attemptId,
      timestamp,
      type,
      content,
      coldHint,
      confidence,
    };
  }

  console.error('Cortex Lattice: Failed to add reflection:', response.error);
  return null;
}

// =============================================================================
// SPACED REPETITION OPERATIONS
// =============================================================================

/**
 * Update spaced repetition after completing a problem.
 */
export async function updateSpacedRepetitionOnComplete(
  problemId: string,
  wasMultiAttempt: boolean,
  confidence?: Confidence
): Promise<void> {
  const now = Date.now();
  const intervalDays = calculateInitialInterval(wasMultiAttempt, confidence);
  const nextReview = now + intervalDays * 24 * 60 * 60 * 1000;

  const response = await apiUpsertSpacedRepetition({
    problemId,
    nextReview,
    intervalDays,
    easeFactor: 2.5,
    reviewCount: 0,
    lastReviewed: now,
  });

  if (!response.success) {
    console.error('Cortex Lattice: Failed to update spaced repetition:', response.error);
  }
}

/**
 * Complete a review session (for spaced repetition).
 */
export async function completeReview(
  problemId: string,
  passed: boolean,
  wasMultiAttempt: boolean,
  currentIntervalDays: number,
  currentEaseFactor: number
): Promise<void> {
  const now = Date.now();
  const result = calculateNextInterval(
    currentIntervalDays,
    currentEaseFactor,
    passed,
    wasMultiAttempt
  );

  const nextReview = now + result.intervalDays * 24 * 60 * 60 * 1000;

  const response = await apiUpsertSpacedRepetition({
    problemId,
    nextReview,
    intervalDays: result.intervalDays,
    easeFactor: result.easeFactor,
    reviewCount: 1, // This would need to be tracked server-side properly
    lastReviewed: now,
  });

  if (!response.success) {
    console.error('Cortex Lattice: Failed to complete review:', response.error);
  }
}

// =============================================================================
// STATS OPERATIONS
// =============================================================================

export interface Stats {
  totalProblems: number;
  totalAttempts: number;
  coldSolveCount: number;
  coldSolveRate: number;
  reviewsDueToday: number;
  currentStreak: number;
}

/**
 * Get stats from the API.
 */
export async function getStats(): Promise<Stats> {
  const res = await apiRequest<Stats>('/api/extension/stats', 'GET');

  if (res.success && res.data) {
    return res.data;
  }

  // Return zeros if API fails
  return {
    totalProblems: 0,
    totalAttempts: 0,
    coldSolveCount: 0,
    coldSolveRate: 0,
    reviewsDueToday: 0,
    currentStreak: 0,
  };
}

// =============================================================================
// REVIEWS DUE OPERATIONS
// =============================================================================

export interface ReviewDueItem {
  problem: {
    id: string;
    title: string;
    url: string;
    platform: string;
    pattern?: string;
    difficulty?: string;
  };
  sr: {
    nextReview: number;
    intervalDays: number;
    easeFactor: number;
    reviewCount: number;
  };
}

/**
 * Get problems that are due for review.
 */
export async function getReviewsDue(): Promise<ReviewDueItem[]> {
  const res = await apiRequest<{ reviews: ReviewDueItem[] }>(
    '/api/extension/reviews-due',
    'GET'
  );

  return res.data?.reviews ?? [];
}
