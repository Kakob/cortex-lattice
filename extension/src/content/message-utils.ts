/**
 * =============================================================================
 * CORTEX LATTICE - MESSAGE UTILITIES
 * =============================================================================
 *
 * Utilities for sending messages from content scripts to the service worker.
 *
 * WHY THIS EXISTS:
 * ----------------
 * Chrome can terminate service workers when idle to save resources.
 * When a content script tries to send a message to a terminated service worker,
 * it fails with "Could not establish connection. Receiving end does not exist."
 *
 * This utility provides retry logic to handle this case gracefully.
 * The first attempt may wake up the service worker, and subsequent attempts succeed.
 */

/**
 * Send a message to the service worker with automatic retry on connection errors.
 *
 * @param message - The message to send
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Base delay between retries in ms (increases with each attempt)
 * @returns The response from the service worker
 * @throws Error if all retries fail
 *
 * @example
 * const response = await sendMessageWithRetry({
 *   type: 'ADD_REFLECTION',
 *   payload: { attemptId: '123', content: 'My thought' }
 * });
 */
export async function sendMessageWithRetry<T = unknown>(
  message: unknown,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a connection error (service worker terminated)
      const isConnectionError =
        lastError.message.includes('Receiving end does not exist') ||
        lastError.message.includes('Could not establish connection') ||
        lastError.message.includes('Extension context invalidated');

      if (isConnectionError && attempt < maxRetries - 1) {
        // Wait before retrying - gives service worker time to wake up
        // Exponential backoff: 100ms, 200ms, 300ms...
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
        console.log(`Cortex Lattice: Retrying message (attempt ${attempt + 2}/${maxRetries})...`);
        continue;
      }

      // For non-connection errors or final attempt, throw immediately
      throw lastError;
    }
  }

  throw lastError || new Error('Failed to send message after retries');
}

/**
 * Send a message without throwing on error.
 * Returns the response or undefined if the message failed.
 * Useful for non-critical messages where we don't want to interrupt the user.
 *
 * @param message - The message to send
 * @returns The response or undefined on error
 */
export async function sendMessageSafe<T = unknown>(
  message: unknown
): Promise<T | undefined> {
  try {
    return await sendMessageWithRetry<T>(message);
  } catch (error) {
    console.warn('Cortex Lattice: Message failed (continuing anyway):', error);
    return undefined;
  }
}
