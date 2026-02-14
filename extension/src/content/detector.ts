/**
 * =============================================================================
 * CORTEX LATTICE - PLATFORM DETECTOR
 * =============================================================================
 *
 * This module detects which coding platform the user is currently on.
 * It uses URL pattern matching to identify supported platforms.
 *
 * SUPPORTED PLATFORMS:
 * - LeetCode (leetcode.com) - The most popular coding interview practice site
 * - DesignGurus/Grokking (designgurus.io) - GTCI (Grokking the Coding Interview)
 *
 * WHY URL-BASED DETECTION:
 * - Reliable: URLs don't change based on page load state
 * - Fast: No need to wait for DOM to load
 * - Simple: Works even if page structure changes
 *
 * ADDING A NEW PLATFORM:
 * 1. Add a regex pattern to PATTERNS
 * 2. Add detection logic in detectPlatform()
 * 3. Add info extraction in getPlatformInfo()
 * 4. Create a scraper file (scraper-newplatform.ts)
 * 5. Wire it up in content/index.ts
 */

import type { Platform } from '../types';

// =============================================================================
// URL PATTERNS
// =============================================================================

/**
 * Regular expressions for detecting supported platforms.
 *
 * LeetCode: https://leetcode.com/problems/two-sum/
 * DesignGurus: https://designgurus.io/course/grokking-the-coding-interview/lesson/...
 */
const PATTERNS = {
  // Matches: leetcode.com/problems/problem-slug
  leetcode: /^https?:\/\/(www\.)?leetcode\.com\/problems\/([^/]+)/,

  // Matches: designgurus.io/course/... or designgurus.io/course-play/...
  grokking: /^https?:\/\/(www\.)?designgurus\.io\/course(-play)?\/([^/]+)/,
};

// =============================================================================
// TYPES
// =============================================================================

/**
 * Detailed information about the current platform and problem.
 */
interface PlatformInfo {
  /** Which platform we're on */
  platform: Platform;
  /** Problem slug from URL (LeetCode) - e.g., "two-sum" */
  problemSlug?: string;
  /** Course slug from URL (DesignGurus) - e.g., "grokking-the-coding-interview" */
  courseSlug?: string;
}

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Detect which supported platform the user is currently on.
 *
 * @returns The platform identifier, or null if not on a supported platform
 *
 * @example
 * // On leetcode.com/problems/two-sum
 * detectPlatform() // Returns 'leetcode'
 *
 * // On google.com
 * detectPlatform() // Returns null
 */
export function detectPlatform(): Platform | null {
  const url = window.location.href;

  if (PATTERNS.leetcode.test(url)) {
    return 'leetcode';
  }

  if (PATTERNS.grokking.test(url)) {
    return 'grokking';
  }

  return null;
}

/**
 * Get detailed information about the current platform and problem.
 *
 * Extracts slugs and identifiers from the URL that can be used
 * for problem identification and matching.
 *
 * @returns Platform info object, or null if not on a supported platform
 *
 * @example
 * // On leetcode.com/problems/two-sum
 * getPlatformInfo()
 * // Returns { platform: 'leetcode', problemSlug: 'two-sum' }
 *
 * // On designgurus.io/course/grokking-the-coding-interview/lesson/...
 * getPlatformInfo()
 * // Returns { platform: 'grokking', courseSlug: 'grokking-the-coding-interview' }
 */
export function getPlatformInfo(): PlatformInfo | null {
  const url = window.location.href;

  // Check LeetCode
  const leetcodeMatch = url.match(PATTERNS.leetcode);
  if (leetcodeMatch) {
    return {
      platform: 'leetcode',
      problemSlug: leetcodeMatch[2], // The captured problem name
    };
  }

  // Check DesignGurus/Grokking
  const grokkingMatch = url.match(PATTERNS.grokking);
  if (grokkingMatch) {
    return {
      platform: 'grokking',
      courseSlug: grokkingMatch[2], // The captured course name
    };
  }

  return null;
}

/**
 * Check if we're on an actual problem page (not just the platform).
 *
 * This distinguishes between:
 * - Problem page: leetcode.com/problems/two-sum (we should track)
 * - List page: leetcode.com/problemset/all (we should NOT track)
 *
 * @returns true if we're on a problem page where tracking should occur
 */
export function isOnProblemPage(): boolean {
  const platform = detectPlatform();

  if (platform === 'leetcode') {
    // LeetCode problem pages always have /problems/ in the path
    return window.location.pathname.startsWith('/problems/');
  }

  if (platform === 'grokking') {
    // DesignGurus problem pages have /course/ in URL AND visible lesson content
    // We check for DOM elements to distinguish from course overview pages
    return window.location.pathname.includes('/course/') &&
           document.querySelector('[class*="lesson"], [class*="problem"], .code-editor') !== null;
  }

  return false;
}
