/**
 * =============================================================================
 * CORTEX LATTICE - CONTENT SCRIPT ENTRY POINT
 * =============================================================================
 *
 * This is the main content script that runs on LeetCode and DesignGurus pages.
 * Content scripts have access to the webpage's DOM but run in an isolated context.
 *
 * WHAT THIS FILE DOES:
 * 1. Detects which platform we're on (LeetCode or DesignGurus)
 * 2. Creates a platform-specific scraper to extract problem info
 * 3. Initializes the modal manager for user interaction
 * 4. Sends START_ATTEMPT message to start tracking
 * 5. Sets up DOM observers for Run/Submit button clicks
 *
 * CONTENT SCRIPT ISOLATION:
 * - Has access to DOM (document, window)
 * - Cannot access page's JavaScript variables (isolated world)
 * - Communicates with service worker via chrome.runtime.sendMessage
 * - Can inject UI elements using Shadow DOM for style isolation
 *
 * LIFECYCLE:
 * - Runs when user navigates to a matching URL (defined in manifest.json)
 * - Re-initializes on SPA navigation (detected via MutationObserver)
 * - Can be invalidated if extension is updated (handled gracefully)
 */

import { detectPlatform, getPlatformInfo } from './detector';
import { createLeetCodeScraper } from './scraper-leetcode';
import { createGrokkingScraper } from './scraper-grokking';
import { setupObserver } from './observer';
import { ModalManager } from './modal-manager';
import { sendMessageWithRetry } from './message-utils';
import type { Platform } from '../types';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Interface for platform-specific scrapers.
 * Each platform (LeetCode, DesignGurus) has different DOM structure,
 * so we need platform-specific code to extract information.
 */
interface PlatformScraper {
  /** Extract the problem title from the page */
  getTitle(): string | null;
  /** Extract the current code from the editor */
  getCode(): string | null;
  /** Extract the difficulty level if displayed */
  getDifficulty(): 'easy' | 'medium' | 'hard' | undefined;
}

// =============================================================================
// MODULE STATE
// =============================================================================

/** The scraper instance for the current platform */
let currentScraper: PlatformScraper | null = null;

/** Which platform we're currently on */
let currentPlatform: Platform | null = null;

/** Modal manager for displaying UI overlays */
let modalManager: ModalManager | null = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Main initialization function.
 * Called when the page loads and on SPA navigation.
 */
async function initialize() {
  // Step 1: Detect which platform we're on
  const platform = detectPlatform();

  if (!platform) {
    console.log('Cortex Lattice: Not on a supported platform');
    return;
  }

  currentPlatform = platform;
  console.log(`Cortex Lattice: Detected platform: ${platform}`);

  // Step 2: Create the appropriate scraper for this platform
  if (platform === 'leetcode') {
    currentScraper = createLeetCodeScraper();
  } else if (platform === 'grokking') {
    currentScraper = createGrokkingScraper();
  }

  // Step 3: Initialize the modal manager (for reflection prompts, quick-log)
  modalManager = new ModalManager();

  // Give the modal manager access to the code scraper so it can
  // capture a snapshot of the code alongside every reflection/stuck point
  if (currentScraper) {
    modalManager.setCodeScraper(() => currentScraper?.getCode() ?? null);
  }

  // Step 4: Get problem info and start tracking
  const info = getPlatformInfo();
  if (info) {
    console.log('Cortex Lattice: Problem info:', info);

    // Extract title and difficulty using the platform scraper
    const title = currentScraper?.getTitle();
    const difficulty = currentScraper?.getDifficulty();

    if (title) {
      try {
        // Send message to service worker to start tracking this problem
        // Uses retry logic in case service worker needs to wake up
        const response = await sendMessageWithRetry<{
          error?: string;
          attempt?: { id: string };
          problem?: { id: string };
        }>({
          type: 'START_ATTEMPT',
          payload: {
            url: window.location.href,
            title,
            platform,
            difficulty,
          },
        });

        // Handle error responses gracefully (API-only mode or DB issues)
        if (response?.error) {
          console.warn('Cortex Lattice: Start attempt returned error (continuing anyway):', response.error);
        } else {
          console.log('Cortex Lattice: Started attempt:', response);

          // Set the attemptId on the modal manager so reflections can be saved
          if (response?.attempt?.id && modalManager) {
            modalManager.setAttemptId(response.attempt.id);
            console.log('Cortex Lattice: Set attemptId for modal:', response.attempt.id);
          }
        }
      } catch (error) {
        // Extension context may be invalidated (e.g., after extension update)
        // Log but don't crash - user can refresh to reconnect
        console.warn('Cortex Lattice: Failed to start attempt (extension may need reload):', error);
      }
    }
  }

  // Step 5: Set up DOM observer to track Run/Submit button clicks
  setupObserver(platform, currentScraper, modalManager);
}

// =============================================================================
// MESSAGE LISTENER
// =============================================================================

/**
 * Listen for messages from the background script.
 *
 * Currently handles:
 * - OPEN_HOTKEY_MODAL: Triggered by keyboard shortcut (Ctrl+Shift+L)
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_HOTKEY_MODAL') {
    if (modalManager) {
      modalManager.showHotkeyModal();
    }
    sendResponse({ success: true });
    return true;
  }
  // Don't return true for unhandled messages - avoids "message channel closed" errors
  return false;
});

// =============================================================================
// PAGE LIFECYCLE
// =============================================================================

/**
 * Initialize when DOM is ready.
 * If the DOM is still loading, wait for DOMContentLoaded.
 * Otherwise, initialize immediately.
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

/**
 * Re-initialize on SPA navigation.
 *
 * LeetCode and DesignGurus are Single Page Applications (SPAs).
 * When the user navigates between problems, the URL changes but
 * the page doesn't fully reload. We detect this via MutationObserver.
 */
let lastUrl = window.location.href;

const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    console.log('Cortex Lattice: URL changed, re-initializing...');
    initialize();
  }
});

// Observe the body for any changes (DOM updates often accompany navigation)
urlObserver.observe(document.body, { childList: true, subtree: true });
