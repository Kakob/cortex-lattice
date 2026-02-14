import type { Platform, SnapshotTrigger, TestResult } from '../types';
import { findLeetCodeButtons, detectLeetCodeTestResult } from './scraper-leetcode';
import { findGrokkingButtons, detectGrokkingTestResult } from './scraper-grokking';
import type { ModalManager } from './modal-manager';
import { sendMessageWithRetry, sendMessageSafe } from './message-utils';

interface PlatformScraper {
  getTitle(): string | null;
  getCode(): string | null;
  getDifficulty(): 'easy' | 'medium' | 'hard' | undefined;
}

interface AttemptState {
  attemptId: string | null;
  problemId: string | null;
  snapshotCount: number;
  lastTestResult: TestResult | undefined;
}

const state: AttemptState = {
  attemptId: null,
  problemId: null,
  snapshotCount: 0,
  lastTestResult: undefined,
};

export function setupObserver(
  platform: Platform,
  scraper: PlatformScraper | null,
  modalManager: ModalManager | null
): void {
  if (!scraper) return;

  // Get current attempt ID
  initializeAttempt();

  // Set up button click observers
  observeButtons(platform, scraper, modalManager);

  // Set up result observer
  observeResults(platform, modalManager);
}

async function initializeAttempt(): Promise<void> {
  try {
    const response = await sendMessageWithRetry<{ problem?: { id: string }; error?: string }>({
      type: 'GET_PROBLEM',
      payload: { url: window.location.href },
    });

    // Handle error responses gracefully
    if (response?.error) {
      console.warn('Cortex Lattice: GET_PROBLEM returned error:', response.error);
      return;
    }

    if (response?.problem) {
      state.problemId = response.problem.id;

      const attemptResponse = await sendMessageWithRetry<{
        attempt?: { id: string; snapshotCount?: number };
        error?: string;
      }>({
        type: 'GET_CURRENT_ATTEMPT',
        payload: { problemId: response.problem.id },
      });

      // Handle error responses gracefully
      if (attemptResponse?.error) {
        console.warn('Cortex Lattice: GET_CURRENT_ATTEMPT returned error:', attemptResponse.error);
        return;
      }

      if (attemptResponse?.attempt) {
        state.attemptId = attemptResponse.attempt.id;
        state.snapshotCount = attemptResponse.attempt.snapshotCount || 0;
      }
    }
  } catch (error) {
    // Extension context may be invalidated - log but don't crash
    console.warn('Cortex Lattice: Failed to initialize attempt (extension may need reload):', error);
  }
}

function observeButtons(
  platform: Platform,
  scraper: PlatformScraper,
  modalManager: ModalManager | null
): void {
  const observer = new MutationObserver(() => {
    const buttons =
      platform === 'leetcode' ? findLeetCodeButtons() : findGrokkingButtons();

    if (buttons.runButton && !buttons.runButton.hasAttribute('data-cortex-observed')) {
      buttons.runButton.setAttribute('data-cortex-observed', 'true');
      buttons.runButton.addEventListener('click', () => {
        handleButtonClick('run', scraper);
      });
    }

    if (buttons.submitButton && !buttons.submitButton.hasAttribute('data-cortex-observed')) {
      buttons.submitButton.setAttribute('data-cortex-observed', 'true');
      buttons.submitButton.addEventListener('click', () => {
        handleButtonClick('submit', scraper);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also try to attach immediately
  const buttons =
    platform === 'leetcode' ? findLeetCodeButtons() : findGrokkingButtons();

  if (buttons.runButton) {
    buttons.runButton.addEventListener('click', () => handleButtonClick('run', scraper));
  }
  if (buttons.submitButton) {
    buttons.submitButton.addEventListener('click', () => handleButtonClick('submit', scraper));
  }
}

async function handleButtonClick(
  trigger: SnapshotTrigger,
  scraper: PlatformScraper
): Promise<void> {
  if (!state.attemptId) {
    await initializeAttempt();
  }

  const code = scraper.getCode();
  if (!code || !state.attemptId) {
    console.warn('Cortex Lattice: Could not capture snapshot - missing code or attempt ID');
    return;
  }

  try {
    const response = await sendMessageWithRetry<{ snapshot?: unknown; error?: string }>({
      type: 'SAVE_SNAPSHOT',
      payload: {
        attemptId: state.attemptId,
        trigger,
        code,
      },
    });

    // Handle error responses gracefully
    if (response?.error) {
      console.warn(`Cortex Lattice: SAVE_SNAPSHOT returned error (continuing anyway):`, response.error);
      // Still increment count locally so UI remains consistent
      state.snapshotCount++;
    } else if (response?.snapshot) {
      state.snapshotCount++;
      console.log(`Cortex Lattice: Saved snapshot #${state.snapshotCount} (${trigger})`);
    }
  } catch (error) {
    // Extension context may be invalidated - log but don't crash
    console.warn('Cortex Lattice: Failed to save snapshot (extension may need reload):', error);
  }
}

function observeResults(platform: Platform, modalManager: ModalManager | null): void {
  let debounceTimer: number | undefined;

  const observer = new MutationObserver(() => {
    // Debounce to avoid multiple triggers
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(() => {
      const result =
        platform === 'leetcode' ? detectLeetCodeTestResult() : detectGrokkingTestResult();

      if (result && result !== state.lastTestResult) {
        state.lastTestResult = result;
        handleTestResult(result, modalManager);
      }
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

async function handleTestResult(
  result: TestResult,
  modalManager: ModalManager | null
): Promise<void> {
  console.log(`Cortex Lattice: Detected test result: ${result}`);

  // Update the last snapshot with the test result
  if (state.attemptId) {
    // We don't have direct access to update the snapshot, but we can log it
    console.log(`Cortex Lattice: Test result for attempt ${state.attemptId}: ${result}`);
  }

  // If passed on submit, show reflection modal
  if (result === 'pass') {
    // Wait a moment for the success animation
    setTimeout(() => {
      if (modalManager && state.attemptId) {
        const isMultiAttempt = state.snapshotCount > 1;
        modalManager.showReflectionModal(isMultiAttempt, async (reflection) => {
          // Save reflection using retry logic
          try {
            const reflectionResponse = await sendMessageWithRetry<{ error?: string }>({
              type: 'ADD_REFLECTION',
              payload: {
                attemptId: state.attemptId,
                type: 'post_solve',
                content: reflection.content,
                coldHint: reflection.coldHint,
                confidence: reflection.confidence,
              },
            });

            if (reflectionResponse?.error) {
              console.warn('Cortex Lattice: ADD_REFLECTION returned error (continuing anyway):', reflectionResponse.error);
            }

            // End the attempt
            const endResponse = await sendMessageWithRetry<{ error?: string }>({
              type: 'END_ATTEMPT',
              payload: {
                attemptId: state.attemptId,
                passed: true,
              },
            });

            if (endResponse?.error) {
              console.warn('Cortex Lattice: END_ATTEMPT returned error:', endResponse.error);
            } else {
              console.log('Cortex Lattice: Attempt completed successfully');
            }
          } catch (error) {
            // Extension context may be invalidated - log but don't crash
            console.warn('Cortex Lattice: Failed to save reflection (extension may need reload):', error);
          }
        });
      }
    }, 1500);
  }
}

// Export for external access
export function getAttemptState(): AttemptState {
  return { ...state };
}
