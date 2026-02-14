/**
 * =============================================================================
 * CORTEX LATTICE - SPACED REPETITION ALGORITHM
 * =============================================================================
 *
 * This module implements a modified SM-2 spaced repetition algorithm.
 * The core idea: review problems at increasing intervals to optimize retention.
 *
 * HOW SPACED REPETITION WORKS:
 * 1. Solve a problem for the first time
 * 2. Schedule a review based on how you solved it
 * 3. When you review, adjust the interval based on success/failure
 * 4. Intervals grow exponentially on success (1d → 3d → 7d → 14d → ...)
 * 5. Intervals reset on failure (back to hours)
 *
 * OUR MODIFICATIONS TO SM-2:
 * - Initial interval depends on HOW you solved (cold solve vs. needed help)
 * - Using AI or viewing solution results in shorter intervals
 * - "Lucky" first-try solves (low confidence) get shorter intervals
 * - Maximum interval capped at 180 days
 *
 * INTERVAL LOGIC (from PRD):
 *
 * First-time solve:
 * - Cold solve, easy:     4 days
 * - Cold solve, moderate: 3 days
 * - Cold solve, lucky:    1 day
 *
 * Multi-attempt solve:
 * - No help:        2 days
 * - Used hint:      1 day
 * - Used AI:        12 hours
 * - Viewed solution: 4 hours
 *
 * Review multipliers:
 * - Cold solve:      interval × 2.0
 * - With hint:       interval × 1.5
 * - With AI:         interval × 1.2
 * - Viewed solution: reset to 4 hours
 * - Failed:          reset to 4 hours
 */

import type { Confidence } from '../types';

// =============================================================================
// INITIAL INTERVAL CALCULATION
// =============================================================================

/**
 * Calculate the initial spaced repetition interval after first solving a problem.
 *
 * @param wasMultiAttempt - Did it take multiple Run/Submit clicks?
 * @param confidence - Self-assessed confidence (for first-try solves)
 * @param usedHint - Did the user look at hints?
 * @param usedAI - Did the user use AI assistance?
 * @param viewedSolution - Did the user view the solution?
 * @returns Initial interval in days (can be fractional for hours)
 *
 * @example
 * // First-try solve with high confidence
 * calculateInitialInterval(false, 'easy') // Returns 4 (days)
 *
 * // Multi-attempt with AI help
 * calculateInitialInterval(true, undefined, false, true) // Returns 0.5 (12 hours)
 */
export function calculateInitialInterval(
  wasMultiAttempt: boolean,
  confidence?: Confidence,
  usedHint?: boolean,
  usedAI?: boolean,
  viewedSolution?: boolean
): number {
  // First-try success - interval based on confidence
  if (!wasMultiAttempt) {
    switch (confidence) {
      case 'easy':
        return 4; // "I could do this in my sleep" → 4 days
      case 'moderate':
        return 3; // "Had to think but got it" → 3 days
      case 'lucky':
        return 1; // "Not sure I could do it again" → 1 day
      default:
        return 3; // Default to moderate
    }
  }

  // Multi-attempt - interval based on how much help was used
  // Intervals in days (decimals for hours)
  if (viewedSolution) {
    return 4 / 24; // 4 hours - strongest help, shortest interval
  }
  if (usedAI) {
    return 12 / 24; // 12 hours - significant help
  }
  if (usedHint) {
    return 1; // 1 day - minor help
  }
  return 2; // 2 days - no help, just took multiple tries
}

// =============================================================================
// NEXT INTERVAL CALCULATION
// =============================================================================

/**
 * Result of calculating the next review interval.
 */
export interface IntervalResult {
  /** Next interval in days */
  intervalDays: number;
  /** Updated ease factor (affects future interval growth) */
  easeFactor: number;
}

/**
 * Calculate the next review interval after a review session.
 *
 * This is the core of the spaced repetition algorithm.
 * On success, intervals grow. On failure, they reset.
 *
 * @param currentIntervalDays - Current interval in days
 * @param currentEaseFactor - Current ease factor (1.3 to 2.5)
 * @param passed - Did the user pass the review?
 * @param wasMultiAttempt - Did it take multiple tries?
 * @param usedHint - Did the user use hints?
 * @param usedAI - Did the user use AI?
 * @param viewedSolution - Did the user view the solution?
 * @returns New interval and ease factor
 *
 * @example
 * // Cold solve on review - interval doubles
 * calculateNextInterval(3, 2.5, true, false)
 * // Returns { intervalDays: 15, easeFactor: 2.5 }
 *
 * // Failed review - reset to 4 hours
 * calculateNextInterval(14, 2.3, false, true)
 * // Returns { intervalDays: 0.167, easeFactor: 2.1 }
 */
export function calculateNextInterval(
  currentIntervalDays: number,
  currentEaseFactor: number,
  passed: boolean,
  wasMultiAttempt: boolean,
  usedHint?: boolean,
  usedAI?: boolean,
  viewedSolution?: boolean
): IntervalResult {
  // Failed or viewed solution → reset to 4 hours
  // Viewing the solution means you didn't really know it
  if (!passed || viewedSolution) {
    return {
      intervalDays: 4 / 24, // 4 hours
      easeFactor: Math.max(1.3, currentEaseFactor - 0.2), // Decrease ease (minimum 1.3)
    };
  }

  // Calculate multiplier based on how you solved it
  let multiplier: number;
  let easeAdjustment: number;

  if (!wasMultiAttempt) {
    // Cold solve - best outcome, interval doubles
    multiplier = 2.0;
    easeAdjustment = 0.1; // Increase ease for future
  } else if (usedAI) {
    // Used AI - weak recall, small increase
    multiplier = 1.2;
    easeAdjustment = -0.1; // Decrease ease
  } else if (usedHint) {
    // Used hint - moderate recall
    multiplier = 1.5;
    easeAdjustment = 0;
  } else {
    // Multi-attempt but no help - good effort
    multiplier = 1.5;
    easeAdjustment = 0;
  }

  // Calculate new interval: current × multiplier × ease factor
  const newInterval = currentIntervalDays * multiplier * currentEaseFactor;

  // Adjust ease factor (clamp between 1.3 and 2.5)
  const newEaseFactor = Math.max(1.3, Math.min(2.5, currentEaseFactor + easeAdjustment));

  // Cap interval at 180 days (6 months)
  return {
    intervalDays: Math.min(180, newInterval),
    easeFactor: newEaseFactor,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a review is currently due.
 *
 * @param nextReviewTimestamp - Unix timestamp of next review
 * @returns true if the review is due now
 */
export function isReviewDue(nextReviewTimestamp: number): boolean {
  return Date.now() >= nextReviewTimestamp;
}

/**
 * Format an interval for display.
 *
 * @param intervalDays - Interval in days
 * @returns Human-readable string (e.g., "4h", "3d", "2w", "1mo")
 *
 * @example
 * formatInterval(0.5)  // "12h"
 * formatInterval(3)    // "3d"
 * formatInterval(14)   // "2w"
 * formatInterval(45)   // "2mo"
 */
export function formatInterval(intervalDays: number): string {
  if (intervalDays < 1) {
    // Less than a day - show hours
    const hours = Math.round(intervalDays * 24);
    return `${hours}h`;
  }
  if (intervalDays < 7) {
    // Less than a week - show days
    return `${Math.round(intervalDays)}d`;
  }
  if (intervalDays < 30) {
    // Less than a month - show weeks
    const weeks = Math.round(intervalDays / 7);
    return `${weeks}w`;
  }
  // Show months
  const months = Math.round(intervalDays / 30);
  return `${months}mo`;
}

/**
 * Format time until next review for display.
 *
 * @param nextReviewTimestamp - Unix timestamp of next review
 * @returns Human-readable string (e.g., "now", "in 4h", "in 3d")
 *
 * @example
 * formatTimeUntilReview(Date.now() - 1000) // "now" (past due)
 * formatTimeUntilReview(Date.now() + 3600000) // "in 1h"
 * formatTimeUntilReview(Date.now() + 86400000 * 3) // "in 3d"
 */
export function formatTimeUntilReview(nextReviewTimestamp: number): string {
  const now = Date.now();
  const diff = nextReviewTimestamp - now;

  // Already due
  if (diff <= 0) {
    return 'now';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `in ${days}d`;
  }
  if (hours > 0) {
    return `in ${hours}h`;
  }

  const minutes = Math.floor(diff / (1000 * 60));
  return `in ${minutes}m`;
}
