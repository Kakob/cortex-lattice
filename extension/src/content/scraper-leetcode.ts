import type { Difficulty } from '../types';

interface LeetCodeScraper {
  getTitle(): string | null;
  getCode(): string | null;
  getDifficulty(): Difficulty | undefined;
  getProblemNumber(): number | undefined;
}

export function createLeetCodeScraper(): LeetCodeScraper {
  return {
    getTitle(): string | null {
      // Try multiple selectors for title
      const selectors = [
        '[data-cy="question-title"]',
        'div[class*="text-title-large"]',
        'div[class*="question-title"]',
        'a[href*="/problems/"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          return element.textContent.trim();
        }
      }

      // Fallback: extract from URL
      const match = window.location.pathname.match(/\/problems\/([^/]+)/);
      if (match) {
        return match[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      return null;
    },

    getCode(): string | null {
      // LeetCode uses Monaco editor
      // Try to get code from Monaco instance
      const monacoEditor = (window as unknown as { monaco?: { editor?: { getModels?: () => Array<{ getValue: () => string }> } } }).monaco?.editor;
      if (monacoEditor?.getModels) {
        const models = monacoEditor.getModels();
        if (models.length > 0) {
          return models[0].getValue();
        }
      }

      // Fallback: try to get from textarea or view-lines
      const viewLines = document.querySelector('.view-lines');
      if (viewLines) {
        // Get text content but preserve line structure
        const lines = viewLines.querySelectorAll('.view-line');
        if (lines.length > 0) {
          return Array.from(lines)
            .map(line => line.textContent || '')
            .join('\n');
        }
      }

      // Try CodeMirror as fallback
      const codeMirror = document.querySelector('.CodeMirror');
      if (codeMirror) {
        const cm = (codeMirror as unknown as { CodeMirror?: { getValue: () => string } }).CodeMirror;
        if (cm?.getValue) {
          return cm.getValue();
        }
      }

      return null;
    },

    getDifficulty(): Difficulty | undefined {
      // Try to find difficulty badge
      const selectors = [
        'div[class*="text-difficulty-easy"]',
        'div[class*="text-difficulty-medium"]',
        'div[class*="text-difficulty-hard"]',
        'span[class*="text-olive"]', // Easy
        'span[class*="text-yellow"]', // Medium
        'span[class*="text-pink"]', // Hard
        'div[diff="easy"]',
        'div[diff="medium"]',
        'div[diff="hard"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.toLowerCase().trim();
          if (text === 'easy') return 'easy';
          if (text === 'medium') return 'medium';
          if (text === 'hard') return 'hard';

          // Check class names
          if (selector.includes('easy') || selector.includes('olive')) return 'easy';
          if (selector.includes('medium') || selector.includes('yellow')) return 'medium';
          if (selector.includes('hard') || selector.includes('pink')) return 'hard';
        }
      }

      return undefined;
    },

    getProblemNumber(): number | undefined {
      const title = this.getTitle();
      if (title) {
        const match = title.match(/^(\d+)\./);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      return undefined;
    },
  };
}

// Find Run and Submit buttons
export function findLeetCodeButtons(): { runButton: Element | null; submitButton: Element | null } {
  const runButton =
    document.querySelector('[data-e2e-locator="console-run-button"]') ||
    document.querySelector('button[data-cy="run-code-btn"]') ||
    Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.toLowerCase().includes('run')
    );

  const submitButton =
    document.querySelector('[data-e2e-locator="console-submit-button"]') ||
    document.querySelector('button[data-cy="submit-code-btn"]') ||
    Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.toLowerCase().includes('submit')
    );

  return { runButton: runButton || null, submitButton: submitButton || null };
}

// Check if tests passed/failed from result panel
export function detectLeetCodeTestResult(): 'pass' | 'fail' | 'error' | undefined {
  // Look for result indicators
  const acceptedIndicator = document.querySelector('[data-e2e-locator="submission-result"]');
  if (acceptedIndicator) {
    const text = acceptedIndicator.textContent?.toLowerCase() || '';
    if (text.includes('accepted')) return 'pass';
    if (text.includes('wrong answer') || text.includes('runtime error') || text.includes('time limit')) return 'fail';
    if (text.includes('error')) return 'error';
  }

  // Check console output
  const consoleResult = document.querySelector('[class*="result"]');
  if (consoleResult) {
    const text = consoleResult.textContent?.toLowerCase() || '';
    if (text.includes('accepted') || text.includes('passed')) return 'pass';
    if (text.includes('wrong') || text.includes('failed')) return 'fail';
    if (text.includes('error')) return 'error';
  }

  return undefined;
}
