/**
 * =============================================================================
 * CORTEX LATTICE - SERVICE WORKER (Background Script)
 * =============================================================================
 *
 * This is the main background script for the Chrome extension.
 * It runs as a service worker, which means:
 * - It persists across page navigations
 * - It can wake up to handle events (messages, alarms)
 * - It has access to Chrome extension APIs
 * - It does NOT have access to DOM (no document, window)
 *
 * RESPONSIBILITIES:
 * 1. Handle messages from content scripts (START_ATTEMPT, SAVE_SNAPSHOT, etc.)
 * 2. Manage alarms for periodic tasks (review checks)
 * 3. Handle keyboard shortcuts (quick-log hotkey)
 *
 * ARCHITECTURE:
 * Content Script ─────► Service Worker ─────► API Operations
 *    (scrapes DOM)      (message handler)     (PostgreSQL via API)
 *
 * The service worker acts as the central hub, coordinating between
 * the content scripts (which interact with the page) and the API
 * layer (which handles persistent storage).
 */

import { handleMessage } from './message-handler';
import { setupAlarms, handleAlarm } from './alarm-manager';

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Handle extension install or update.
 * This runs once when the extension is first installed or updated.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cortex Lattice extension installed');

  // Set up periodic alarms for review checks
  setupAlarms();
});

// =============================================================================
// MESSAGE HANDLING
// =============================================================================

/**
 * Handle messages from content scripts and popup.
 *
 * Message types include:
 * - START_ATTEMPT: User navigated to a problem page
 * - END_ATTEMPT: User completed or abandoned a problem
 * - SAVE_SNAPSHOT: User clicked Run or Submit
 * - ADD_STUCK_POINT: User logged a stuck point
 * - ADD_REFLECTION: User logged a thought/reflection
 * - GET_STATS: Popup requested statistics
 * - GET_REVIEW_QUEUE: Popup requested due reviews
 *
 * We return true from the listener to indicate async response handling.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let responded = false;
  const safeSendResponse = (response: unknown) => {
    if (!responded) {
      responded = true;
      try {
        sendResponse(response);
      } catch (e) {
        // Channel may already be closed
        console.warn('Cortex Lattice: sendResponse failed (channel closed):', e);
      }
    }
  };

  // Handle the message asynchronously
  handleMessage(message, sender)
    .then(safeSendResponse)
    .catch((error) => {
      console.error('Error handling message:', error);
      safeSendResponse({ error: error instanceof Error ? error.message : String(error) });
    });

  // Return true to indicate we'll call sendResponse asynchronously
  // Without this, Chrome closes the message channel before we respond
  return true;
});

// =============================================================================
// ALARM HANDLING
// =============================================================================

/**
 * Handle alarm events.
 *
 * Alarms are used for periodic tasks:
 * - check-reviews: Hourly check for due reviews (shows notification)
 */
chrome.alarms.onAlarm.addListener(handleAlarm);

// =============================================================================
// KEYBOARD SHORTCUT HANDLING
// =============================================================================

/**
 * Handle keyboard commands defined in manifest.json.
 *
 * Currently supports:
 * - quick-log: Opens the quick logging modal (Ctrl+Shift+L by default)
 *
 * The shortcut triggers a message to the active tab's content script,
 * which then displays the modal overlay.
 */
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-log') {
    // Send message to the active tab to open the quick-log modal
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_HOTKEY_MODAL' });
      }
    });
  }
});
