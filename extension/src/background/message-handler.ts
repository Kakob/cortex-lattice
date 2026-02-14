import type { ExtensionMessage, StatsResponse, ReviewQueueResponse } from '../types/messages';
import {
  getOrCreateProblem,
  getProblemByUrl,
  startAttempt,
  endAttempt,
  getCurrentAttempt,
  saveSnapshot,
  addStuckPoint,
  addReflection,
  getStats,
  getReviewsDue,
  completeReview,
} from '../db/operations';

export async function handleMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case 'START_ATTEMPT': {
      try {
        const { url, title, platform, difficulty } = message.payload;
        const problem = await getOrCreateProblem(url, title, platform, difficulty);
        if (!problem) {
          return { error: 'Failed to create or get problem - are you logged in?' };
        }
        const attempt = await startAttempt(problem.id);
        if (!attempt) {
          return { error: 'Failed to start attempt - are you logged in?' };
        }
        return { attempt, problem };
      } catch (error) {
        console.error('Cortex Lattice: START_ATTEMPT failed:', error);
        return { error: 'Failed to start attempt', details: String(error) };
      }
    }

    case 'END_ATTEMPT': {
      try {
        const { attemptId, passed } = message.payload;
        const attempt = await endAttempt(attemptId, passed);
        return { attempt };
      } catch (error) {
        console.error('Cortex Lattice: END_ATTEMPT failed:', error);
        return { error: 'Failed to end attempt', details: String(error) };
      }
    }

    case 'SAVE_SNAPSHOT': {
      try {
        const { attemptId, trigger, code, testResult } = message.payload;
        const snapshot = await saveSnapshot(attemptId, trigger, code, testResult);
        return { snapshot };
      } catch (error) {
        console.error('Cortex Lattice: SAVE_SNAPSHOT failed:', error);
        return { error: 'Failed to save snapshot', details: String(error) };
      }
    }

    case 'ADD_STUCK_POINT': {
      try {
        const { attemptId, description, intendedAction, codeSnapshot } = message.payload;
        const stuckPoint = await addStuckPoint(attemptId, description, intendedAction, codeSnapshot);
        return { stuckPoint };
      } catch (error) {
        console.error('Cortex Lattice: ADD_STUCK_POINT failed:', error);
        return { error: 'Failed to add stuck point', details: String(error) };
      }
    }

    case 'ADD_REFLECTION': {
      try {
        const { attemptId, type, content, coldHint, confidence, codeSnapshot } = message.payload;
        const reflection = await addReflection(attemptId, type, content, coldHint, confidence, codeSnapshot);
        return { reflection };
      } catch (error) {
        console.error('Cortex Lattice: ADD_REFLECTION failed:', error);
        return { error: 'Failed to add reflection', details: String(error) };
      }
    }

    case 'GET_CURRENT_ATTEMPT': {
      try {
        const { problemId } = message.payload;
        const attempt = await getCurrentAttempt(problemId);
        return { attempt };
      } catch (error) {
        console.error('Cortex Lattice: GET_CURRENT_ATTEMPT failed:', error);
        return { attempt: undefined, error: 'Failed to get current attempt' };
      }
    }

    case 'GET_PROBLEM': {
      try {
        const { url } = message.payload;
        const problem = await getProblemByUrl(url);
        return { problem };
      } catch (error) {
        console.error('Cortex Lattice: GET_PROBLEM failed:', error);
        return { problem: undefined, error: 'Failed to get problem' };
      }
    }

    case 'GET_STATS': {
      try {
        const stats = await getStats();
        return stats as StatsResponse;
      } catch (error) {
        console.error('Cortex Lattice: GET_STATS failed:', error);
        // Return zero stats on failure
        return {
          totalProblems: 0,
          totalAttempts: 0,
          coldSolveCount: 0,
          coldSolveRate: 0,
          reviewsDueToday: 0,
          reviewsCompleted: 0,
          currentStreak: 0,
        } as StatsResponse;
      }
    }

    case 'GET_REVIEW_QUEUE': {
      try {
        const reviews = await getReviewsDue();
        const now = Date.now();

        const dueNow = reviews
          .filter(r => r.sr.nextReview <= now)
          .map(r => ({ ...r, isDueNow: true }));

        const dueToday = reviews
          .filter(r => r.sr.nextReview > now)
          .map(r => ({ ...r, isDueNow: false }));

        return { dueNow, dueToday } as ReviewQueueResponse;
      } catch (error) {
        console.error('Cortex Lattice: GET_REVIEW_QUEUE failed:', error);
        // Return empty queues on failure
        return { dueNow: [], dueToday: [] } as ReviewQueueResponse;
      }
    }

    case 'COMPLETE_REVIEW': {
      try {
        const { problemId, passed, wasMultiAttempt, currentIntervalDays, currentEaseFactor } = message.payload;
        await completeReview(
          problemId,
          passed,
          wasMultiAttempt,
          currentIntervalDays ?? 1,
          currentEaseFactor ?? 2.5
        );
        return { success: true };
      } catch (error) {
        console.error('Cortex Lattice: COMPLETE_REVIEW failed:', error);
        return { success: false, error: 'Failed to complete review', details: String(error) };
      }
    }

    case 'CHECK_REVIEWS_DUE': {
      try {
        const reviews = await getReviewsDue();
        const dueNow = reviews.filter(r => r.sr.nextReview <= Date.now());

        if (dueNow.length > 0) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon128.png'),
            title: 'Reviews Due',
            message: `You have ${dueNow.length} problem${dueNow.length > 1 ? 's' : ''} ready for review!`,
            priority: 2,
          });
        }

        return { dueCount: dueNow.length };
      } catch (error) {
        console.error('Cortex Lattice: CHECK_REVIEWS_DUE failed:', error);
        return { dueCount: 0 };
      }
    }

    default:
      console.warn('Unknown message type:', (message as { type: string }).type);
      return { error: 'Unknown message type' };
  }
}
