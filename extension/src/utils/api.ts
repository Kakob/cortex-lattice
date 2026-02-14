/**
 * =============================================================================
 * CORTEX LATTICE - API UTILITY
 * =============================================================================
 *
 * This module handles all communication with the web app's API.
 * The API (PostgreSQL) is the single source of truth for all user data.
 *
 * ARCHITECTURE:
 * Extension ──► This Module ──► Next.js API ──► PostgreSQL
 *
 * API ENDPOINTS (all under /api/extension/):
 * - GET  /stats         - Get user statistics
 * - GET  /reviews-due   - Get problems due for review
 * - GET  /problems?url= - Get problem by URL
 * - POST /problems      - Create a new problem
 * - GET  /attempts?problemId= - Get current in-progress attempt
 * - POST /attempts      - Create a new attempt
 * - PATCH /attempts/:id - Update an attempt (complete, pass/fail)
 * - POST /snapshots     - Save a code snapshot
 * - POST /stuck-points  - Record a stuck point
 * - POST /reflections   - Save a reflection
 * - POST /spaced-repetition - Update review schedule
 *
 * AUTHENTICATION:
 * - Uses cookie-based auth (credentials: 'include')
 * - User must be logged into the web app first
 * - Returns 401 if not authenticated
 *
 * ERROR HANDLING:
 * - Network errors return { success: false, status: 0 }
 * - Server errors include error message
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Base URL for the web app API.
 * Change this when deploying to production.
 */
const WEB_APP_URL = 'http://localhost:3001';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Standard API response wrapper.
 * All API functions return this shape for consistent error handling.
 */
export interface ApiResponse<T> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response data (only present on success) */
  data?: T;
  /** Error message (only present on failure) */
  error?: string;
  /** HTTP status code (0 for network errors) */
  status: number;
}

/**
 * Sync status for UI display.
 */
export type SyncStatus = 'synced' | 'pending' | 'error';

// =============================================================================
// CORE REQUEST FUNCTION
// =============================================================================

/**
 * Get the session cookie using Chrome's cookies API.
 * This is more reliable than credentials: 'include' from the service worker
 * context, which can fail with Secure/SameSite cookie edge cases.
 */
async function getSessionCookie(): Promise<string | null> {
  try {
    // Try the dev cookie name first, then production
    const cookieNames = ['authjs.session-token', '__Secure-authjs.session-token'];
    for (const name of cookieNames) {
      const cookie = await chrome.cookies.get({
        url: WEB_APP_URL,
        name,
      });
      if (cookie) {
        return `${cookie.name}=${cookie.value}`;
      }
    }
    return null;
  } catch {
    // chrome.cookies may not be available (e.g., in content script context)
    return null;
  }
}

/**
 * Make an authenticated API request.
 *
 * Uses chrome.cookies API to explicitly attach the session cookie,
 * which is more reliable than credentials: 'include' from extension
 * service workers (avoids Secure/SameSite cross-origin edge cases).
 */
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Manually attach the session cookie
    const sessionCookie = await getSessionCookie();
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    const response = await fetch(`${WEB_APP_URL}${endpoint}`, {
      method,
      headers,
      credentials: 'include', // Also keep as fallback
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle authentication failure
    if (response.status === 401) {
      console.warn(`Cortex Lattice API: 401 on ${method} ${endpoint} (cookie ${sessionCookie ? 'present' : 'MISSING'})`);
      return {
        success: false,
        error: 'Not authenticated. Please log in to the web app.',
        status: 401,
      };
    }

    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Cortex Lattice API: ${response.status} on ${method} ${endpoint}:`, errorData);
      return {
        success: false,
        error: errorData.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    // Success - parse and return data
    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    // Network error - likely offline or server down
    console.error(`Cortex Lattice API: Network error on ${method} ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0, // 0 indicates network failure
    };
  }
}

// =============================================================================
// PROBLEM API
// =============================================================================

/**
 * Request body for creating a problem.
 */
export interface CreateProblemRequest {
  /** Original local ID from extension (for deduplication) */
  odl: string;
  /** Platform identifier */
  platform: string;
  /** Full URL of the problem */
  url: string;
  /** Problem title */
  title: string;
  /** Normalized title for matching */
  normalizedTitle: string;
  /** Algorithmic pattern (optional) */
  pattern?: string;
  /** Difficulty level (optional) */
  difficulty?: string;
  /** GTCI curriculum track (optional) */
  curriculumTrack?: string;
  /** Index within curriculum (optional) */
  curriculumIndex?: number;
}

/**
 * Response from creating a problem.
 */
export interface CreateProblemResponse {
  /** PostgreSQL UUID assigned to this problem */
  id: string;
  /** The odl we sent (echoed back for confirmation) */
  odl: string;
  /** True if this was a new problem, false if it already existed */
  isNew: boolean;
}

/**
 * Create or get a problem in the database.
 *
 * If a problem with the same normalizedTitle already exists for this user,
 * returns the existing problem instead of creating a duplicate.
 */
export function createProblem(data: CreateProblemRequest) {
  return apiRequest<CreateProblemResponse>('/api/extension/problems', 'POST', data);
}

// =============================================================================
// ATTEMPT API
// =============================================================================

/**
 * Request body for creating an attempt.
 */
export interface CreateAttemptRequest {
  /** Original local ID from extension */
  odl: string;
  /** PostgreSQL problem ID (from createProblem response) */
  problemId: string;
  /** When the attempt started (Unix timestamp) */
  startedAt: number;
}

/**
 * Response from creating an attempt.
 */
export interface CreateAttemptResponse {
  /** PostgreSQL UUID assigned to this attempt */
  id: string;
  /** The odl we sent */
  odl: string;
  /** True if this was a new attempt */
  isNew: boolean;
}

/**
 * Create a new attempt for a problem.
 */
export function createAttempt(data: CreateAttemptRequest) {
  return apiRequest<CreateAttemptResponse>('/api/extension/attempts', 'POST', data);
}

/**
 * Request body for updating an attempt.
 */
export interface UpdateAttemptRequest {
  /** When the attempt completed (Unix timestamp) */
  completedAt?: number;
  /** New status */
  status?: string;
  /** Whether the user passed */
  passed?: boolean;
  /** Updated snapshot count */
  snapshotCount?: number;
}

/**
 * Response from updating an attempt.
 */
export interface UpdateAttemptResponse {
  /** The attempt ID */
  id: string;
  /** Whether the update was applied */
  updated: boolean;
}

/**
 * Update an existing attempt (e.g., mark as completed).
 *
 * @param id - PostgreSQL attempt ID
 * @param data - Fields to update
 */
export function updateAttempt(id: string, data: UpdateAttemptRequest) {
  return apiRequest<UpdateAttemptResponse>(`/api/extension/attempts/${id}`, 'PATCH', data);
}

// =============================================================================
// SNAPSHOT API
// =============================================================================

/**
 * Request body for creating a snapshot.
 */
export interface CreateSnapshotRequest {
  /** Original local ID */
  odl: string;
  /** PostgreSQL attempt ID */
  attemptId: string;
  /** When the snapshot was taken */
  timestamp: number;
  /** What triggered the snapshot (run/submit) */
  trigger: string;
  /** The code content */
  code: string;
  /** Test result if available */
  testResult?: string;
}

/**
 * Response from creating a snapshot.
 */
export interface CreateSnapshotResponse {
  /** PostgreSQL UUID */
  id: string;
  /** The odl we sent */
  odl: string;
}

/**
 * Save a code snapshot.
 */
export function createSnapshot(data: CreateSnapshotRequest) {
  return apiRequest<CreateSnapshotResponse>('/api/extension/snapshots', 'POST', data);
}

// =============================================================================
// STUCK POINT API
// =============================================================================

/**
 * Request body for creating a stuck point.
 */
export interface CreateStuckPointRequest {
  /** Original local ID */
  odl: string;
  /** PostgreSQL attempt ID */
  attemptId: string;
  /** When this was recorded */
  timestamp: number;
  /** What the user is stuck on */
  description: string;
  /** What the user plans to do next */
  intendedAction: string;
  /** Code at the time of this stuck point */
  codeSnapshot?: string;
}

/**
 * Response from creating a stuck point.
 */
export interface CreateStuckPointResponse {
  /** PostgreSQL UUID */
  id: string;
  /** The odl we sent */
  odl: string;
}

/**
 * Record a stuck point.
 */
export function createStuckPoint(data: CreateStuckPointRequest) {
  return apiRequest<CreateStuckPointResponse>('/api/extension/stuck-points', 'POST', data);
}

// =============================================================================
// REFLECTION API
// =============================================================================

/**
 * Request body for creating a reflection.
 */
export interface CreateReflectionRequest {
  /** Original local ID */
  odl: string;
  /** PostgreSQL attempt ID */
  attemptId: string;
  /** When this was recorded */
  timestamp: number;
  /** Type of reflection */
  type: string;
  /** Reflection content */
  content: string;
  /** Hint for next review (optional) */
  coldHint?: string;
  /** Self-assessed confidence (optional) */
  confidence?: string;
  /** Code at the time of this reflection */
  codeSnapshot?: string;
}

/**
 * Response from creating a reflection.
 */
export interface CreateReflectionResponse {
  /** PostgreSQL UUID */
  id: string;
  /** The odl we sent */
  odl: string;
}

/**
 * Save a reflection.
 */
export function createReflection(data: CreateReflectionRequest) {
  return apiRequest<CreateReflectionResponse>('/api/extension/reflections', 'POST', data);
}

// =============================================================================
// SPACED REPETITION API
// =============================================================================

/**
 * Request body for updating spaced repetition data.
 */
export interface UpsertSpacedRepetitionRequest {
  /** PostgreSQL problem ID */
  problemId: string;
  /** When the next review is due */
  nextReview: number;
  /** Current interval in days */
  intervalDays: number;
  /** SM-2 ease factor */
  easeFactor: number;
  /** Total review count */
  reviewCount: number;
  /** When last reviewed (optional) */
  lastReviewed?: number;
}

/**
 * Response from upserting spaced repetition data.
 */
export interface UpsertSpacedRepetitionResponse {
  /** PostgreSQL UUID */
  id: string;
  /** True if created, false if updated */
  isNew: boolean;
}

/**
 * Create or update spaced repetition data for a problem.
 * Uses "upsert" semantics - creates if not exists, updates if exists.
 */
export function upsertSpacedRepetition(data: UpsertSpacedRepetitionRequest) {
  return apiRequest<UpsertSpacedRepetitionResponse>('/api/extension/spaced-repetition', 'POST', data);
}

// =============================================================================
// REVIEW RESULT API
// =============================================================================

/**
 * Request body for creating a review result.
 */
export interface CreateReviewResultRequest {
  /** Original local ID */
  odl: string;
  /** PostgreSQL problem ID */
  problemId: string;
  /** When the review was completed */
  timestamp: number;
  /** Whether the user passed */
  passed: boolean;
  /** Whether it took multiple attempts */
  wasMultiAttempt: boolean;
  /** Interval before the review */
  previousInterval: number;
  /** Interval after the review */
  newInterval: number;
}

/**
 * Response from creating a review result.
 */
export interface CreateReviewResultResponse {
  /** PostgreSQL UUID */
  id: string;
  /** The odl we sent */
  odl: string;
}

/**
 * Record a completed review session.
 */
export function createReviewResult(data: CreateReviewResultRequest) {
  return apiRequest<CreateReviewResultResponse>('/api/extension/review-results', 'POST', data);
}
