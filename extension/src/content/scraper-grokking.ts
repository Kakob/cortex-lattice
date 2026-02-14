import type { Difficulty } from '../types';

// Scraper for DesignGurus.io (Grokking courses)
interface GrokkingScraper {
  getTitle(): string | null;
  getCode(): string | null;
  getDifficulty(): Difficulty | undefined;
  getPattern(): string | undefined;
}

export function createGrokkingScraper(): GrokkingScraper {
  return {
    getTitle(): string | null {
      // Try to find lesson/problem title on DesignGurus
      const selectors = [
        'h1[class*="title"]',
        'h1[class*="lesson"]',
        '.lesson-title',
        '.problem-title',
        '[data-testid="problem-title"]',
        'h1',
        '.content-header h1',
        '.challenge-title',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          const text = element.textContent.trim();
          // Filter out generic titles
          if (text &&
              !text.toLowerCase().includes('design gurus') &&
              !text.toLowerCase().includes('grokking') &&
              text.length < 200) {
            return text;
          }
        }
      }

      // Try to get from breadcrumb
      const breadcrumb = document.querySelector('.breadcrumb-item:last-child, [class*="breadcrumb"] a:last-child');
      if (breadcrumb?.textContent) {
        return breadcrumb.textContent.trim();
      }

      // Fallback: extract from URL
      const match = window.location.pathname.match(/\/lesson\/([^/]+)/);
      if (match) {
        return match[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      return null;
    },

    getCode(): string | null {
      // DesignGurus uses Monaco editor (similar to LeetCode)
      const monacoEditor = (window as unknown as { monaco?: { editor?: { getModels?: () => Array<{ getValue: () => string }> } } }).monaco?.editor;
      if (monacoEditor?.getModels) {
        const models = monacoEditor.getModels();
        if (models.length > 0) {
          return models[0].getValue();
        }
      }

      // Try CodeMirror
      const codeMirrorElements = document.querySelectorAll('.CodeMirror');
      for (const element of codeMirrorElements) {
        const cm = (element as unknown as { CodeMirror?: { getValue: () => string } }).CodeMirror;
        if (cm?.getValue) {
          const code = cm.getValue();
          if (code && code.trim().length > 0) {
            return code;
          }
        }
      }

      // Try to get from Monaco view-lines
      const viewLines = document.querySelector('.view-lines');
      if (viewLines) {
        const lines = viewLines.querySelectorAll('.view-line');
        if (lines.length > 0) {
          return Array.from(lines)
            .map(line => line.textContent || '')
            .join('\n');
        }
      }

      // Try to get from code editor container or textarea
      const codeContainer = document.querySelector('.code-editor, [class*="code-editor"], [class*="editor-container"]');
      if (codeContainer) {
        const textArea = codeContainer.querySelector('textarea');
        if (textArea?.value) {
          return textArea.value;
        }
      }

      // Try ace editor
      const aceEditor = document.querySelector('.ace_editor');
      if (aceEditor) {
        const ace = (window as unknown as { ace?: { edit: (el: Element) => { getValue: () => string } } }).ace;
        if (ace) {
          try {
            const editor = ace.edit(aceEditor);
            return editor.getValue();
          } catch {
            // Editor might not be initialized
          }
        }
      }

      return null;
    },

    getDifficulty(): Difficulty | undefined {
      // DesignGurus shows difficulty in badges/tags
      const difficultySelectors = [
        '[class*="difficulty"]',
        '[class*="level"]',
        '.badge',
        '.tag',
        '[class*="easy"]',
        '[class*="medium"]',
        '[class*="hard"]',
      ];

      for (const selector of difficultySelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent?.toLowerCase() || '';
          const className = element.className?.toLowerCase() || '';

          if (text.includes('easy') || className.includes('easy')) return 'easy';
          if (text.includes('medium') || className.includes('medium')) return 'medium';
          if (text.includes('hard') || className.includes('hard')) return 'hard';
        }
      }

      // Try to infer from URL
      const url = window.location.href.toLowerCase();
      if (url.includes('easy')) return 'easy';
      if (url.includes('medium')) return 'medium';
      if (url.includes('hard')) return 'hard';

      return undefined;
    },

    getPattern(): string | undefined {
      // Try to extract pattern from URL
      const url = window.location.href;

      // DesignGurus URL structure: /course/grokking-the-coding-interview/lesson/...
      const courseMatch = url.match(/\/course\/([^/]+)/);
      if (courseMatch) {
        const courseSlug = courseMatch[1];

        // Map course names to patterns
        if (courseSlug.includes('coding-interview')) {
          return 'gtci';
        }
        if (courseSlug.includes('system-design')) {
          return 'system-design';
        }
        return courseSlug;
      }

      // Try to find pattern in page content
      const patternSelectors = [
        '[class*="pattern"]',
        '.category-tag',
        '.topic-tag',
        '[class*="category"]',
      ];

      for (const selector of patternSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          return element.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        }
      }

      return undefined;
    },
  };
}

// Find Run and Submit buttons on DesignGurus
export function findGrokkingButtons(): { runButton: Element | null; submitButton: Element | null } {
  const buttons = document.querySelectorAll('button');

  let runButton: Element | null = null;
  let submitButton: Element | null = null;

  for (const button of buttons) {
    const text = button.textContent?.toLowerCase() || '';
    const className = button.className.toLowerCase();
    const dataTestId = button.getAttribute('data-testid')?.toLowerCase() || '';

    // Run button detection
    if (text.includes('run') ||
        className.includes('run') ||
        dataTestId.includes('run') ||
        text.includes('execute')) {
      runButton = button;
    }

    // Submit button detection
    if (text.includes('submit') ||
        text.includes('test') ||
        className.includes('submit') ||
        dataTestId.includes('submit') ||
        text.includes('check')) {
      submitButton = button;
    }
  }

  // If no submit found, try specific selectors
  if (!submitButton) {
    submitButton = document.querySelector('[data-testid="submit-btn"], .submit-btn, [class*="submit"]');
  }
  if (!runButton) {
    runButton = document.querySelector('[data-testid="run-btn"], .run-btn, [class*="run-code"]');
  }

  return { runButton, submitButton };
}

// Check if tests passed/failed from result panel on DesignGurus
export function detectGrokkingTestResult(): 'pass' | 'fail' | 'error' | undefined {
  // Look for result indicators
  const resultSelectors = [
    '.result-panel',
    '.output-panel',
    '[class*="result"]',
    '[class*="output"]',
    '[data-testid*="result"]',
  ];

  for (const selector of resultSelectors) {
    const resultPanel = document.querySelector(selector);
    if (resultPanel) {
      const text = resultPanel.textContent?.toLowerCase() || '';
      const className = resultPanel.className?.toLowerCase() || '';

      if (text.includes('passed') ||
          text.includes('correct') ||
          text.includes('success') ||
          text.includes('accepted') ||
          className.includes('success') ||
          className.includes('passed')) {
        return 'pass';
      }
      if (text.includes('failed') ||
          text.includes('wrong') ||
          text.includes('incorrect') ||
          className.includes('fail') ||
          className.includes('error')) {
        return 'fail';
      }
      if (text.includes('error') ||
          text.includes('exception') ||
          text.includes('runtime')) {
        return 'error';
      }
    }
  }

  // Check for success/error icons or status indicators
  const successIndicators = [
    '.success-icon',
    '[class*="success"]',
    '.check-icon',
    '[class*="check"]',
    '.passed',
  ];

  for (const selector of successIndicators) {
    if (document.querySelector(selector)) {
      // Make sure it's visible and in a result context
      const el = document.querySelector(selector);
      if (el && el.closest('[class*="result"], [class*="output"]')) {
        return 'pass';
      }
    }
  }

  const errorIndicators = [
    '.error-icon',
    '[class*="error"]:not(button)',
    '.x-icon',
    '.failed',
  ];

  for (const selector of errorIndicators) {
    const el = document.querySelector(selector);
    if (el && el.closest('[class*="result"], [class*="output"]')) {
      return 'fail';
    }
  }

  return undefined;
}
