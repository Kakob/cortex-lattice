import type {
  Problem,
  Attempt,
  Snapshot,
  StuckPoint,
  Reflection,
  SpacedRepetition,
  SnapshotTrigger,
  TestResult,
  IntendedAction,
  ReflectionType,
  Confidence
} from './index';

// Message types for chrome.runtime messaging
export type MessageType =
  | 'START_ATTEMPT'
  | 'END_ATTEMPT'
  | 'SAVE_SNAPSHOT'
  | 'ADD_STUCK_POINT'
  | 'ADD_REFLECTION'
  | 'GET_CURRENT_ATTEMPT'
  | 'GET_PROBLEM'
  | 'GET_STATS'
  | 'GET_REVIEW_QUEUE'
  | 'COMPLETE_REVIEW'
  | 'CHECK_REVIEWS_DUE';

export interface StartAttemptMessage {
  type: 'START_ATTEMPT';
  payload: {
    url: string;
    title: string;
    platform: 'leetcode' | 'grokking';
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

export interface EndAttemptMessage {
  type: 'END_ATTEMPT';
  payload: {
    attemptId: string;
    passed: boolean;
  };
}

export interface SaveSnapshotMessage {
  type: 'SAVE_SNAPSHOT';
  payload: {
    attemptId: string;
    trigger: SnapshotTrigger;
    code: string;
    testResult?: TestResult;
  };
}

export interface AddStuckPointMessage {
  type: 'ADD_STUCK_POINT';
  payload: {
    attemptId: string;
    description: string;
    intendedAction: IntendedAction;
    codeSnapshot?: string;
  };
}

export interface AddReflectionMessage {
  type: 'ADD_REFLECTION';
  payload: {
    attemptId: string;
    type: ReflectionType;
    content: string;
    coldHint?: string;
    confidence?: Confidence;
    codeSnapshot?: string;
  };
}

export interface GetCurrentAttemptMessage {
  type: 'GET_CURRENT_ATTEMPT';
  payload: {
    problemId: string;
  };
}

export interface GetProblemMessage {
  type: 'GET_PROBLEM';
  payload: {
    url: string;
  };
}

export interface GetStatsMessage {
  type: 'GET_STATS';
}

export interface GetReviewQueueMessage {
  type: 'GET_REVIEW_QUEUE';
}

export interface CompleteReviewMessage {
  type: 'COMPLETE_REVIEW';
  payload: {
    problemId: string;
    passed: boolean;
    wasMultiAttempt: boolean;
    currentIntervalDays?: number;
    currentEaseFactor?: number;
  };
}

export interface CheckReviewsDueMessage {
  type: 'CHECK_REVIEWS_DUE';
}

export type ExtensionMessage =
  | StartAttemptMessage
  | EndAttemptMessage
  | SaveSnapshotMessage
  | AddStuckPointMessage
  | AddReflectionMessage
  | GetCurrentAttemptMessage
  | GetProblemMessage
  | GetStatsMessage
  | GetReviewQueueMessage
  | CompleteReviewMessage
  | CheckReviewsDueMessage;

// Response types
export interface StartAttemptResponse {
  attempt: Attempt;
  problem: Problem;
}

export interface StatsResponse {
  totalProblems: number;
  totalAttempts: number;
  coldSolveCount: number;
  coldSolveRate: number;
  reviewsDueToday: number;
  reviewsCompleted: number;
  currentStreak: number;
}

export interface ReviewQueueItem {
  problem: Problem;
  sr: SpacedRepetition;
  isDueNow: boolean;
}

export interface ReviewQueueResponse {
  dueNow: ReviewQueueItem[];
  dueToday: ReviewQueueItem[];
}
