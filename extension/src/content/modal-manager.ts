import type { IntendedAction, Confidence, ReflectionType } from '../types';
import { sendMessageWithRetry } from './message-utils';

interface HotkeyEntry {
  type: ReflectionType;
  content: string;
  intendedAction?: IntendedAction;
}

interface ReflectionData {
  content: string;
  coldHint?: string;
  confidence?: Confidence;
}

export class ModalManager {
  private shadowHost: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private currentAttemptId: string | null = null;
  private codeScraper: (() => string | null) | null = null;

  constructor() {
    this.createShadowContainer();
  }

  setCodeScraper(scraper: () => string | null): void {
    this.codeScraper = scraper;
  }

  private createShadowContainer(): void {
    // Create shadow host
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'cortex-lattice-modal-host';
    this.shadowHost.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 999999;
    `;

    // Attach shadow DOM
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = this.getModalStyles();
    this.shadowRoot.appendChild(styles);

    // Add to document
    document.body.appendChild(this.shadowHost);
  }

  private getModalStyles(): string {
    return `
      .cortex-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.15s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .cortex-modal {
        background: #1e293b;
        border-radius: 12px;
        border: 1px solid #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow: hidden;
        animation: slideUp 0.2s ease-out;
      }

      .cortex-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #334155;
      }

      .cortex-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0;
      }

      .cortex-modal-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        font-size: 20px;
        line-height: 1;
      }

      .cortex-modal-close:hover {
        background: #334155;
        color: #f1f5f9;
      }

      .cortex-modal-body {
        padding: 20px;
        overflow-y: auto;
        max-height: calc(90vh - 140px);
      }

      .cortex-modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #334155;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .cortex-input, .cortex-textarea {
        width: 100%;
        padding: 10px 14px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        color: #f1f5f9;
        font-size: 14px;
        transition: all 0.15s;
        box-sizing: border-box;
      }

      .cortex-textarea {
        resize: vertical;
        min-height: 100px;
        font-family: inherit;
      }

      .cortex-input:focus, .cortex-textarea:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
      }

      .cortex-input::placeholder, .cortex-textarea::placeholder {
        color: #64748b;
      }

      .cortex-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #f1f5f9;
        margin-bottom: 8px;
      }

      .cortex-form-group {
        margin-bottom: 16px;
      }

      .cortex-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
        border: none;
      }

      .cortex-btn-primary {
        background: #6366f1;
        color: white;
      }

      .cortex-btn-primary:hover {
        background: #4f46e5;
      }

      .cortex-btn-secondary {
        background: #334155;
        color: #f1f5f9;
      }

      .cortex-btn-secondary:hover {
        background: #475569;
      }

      .cortex-entry-types {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .cortex-entry-type {
        flex: 1;
        min-width: 100px;
        padding: 10px;
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 8px;
        color: #94a3b8;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
      }

      .cortex-entry-type:hover {
        border-color: #475569;
        color: #f1f5f9;
      }

      .cortex-entry-type.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
        color: #f1f5f9;
      }

      .cortex-option-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .cortex-option-btn {
        padding: 12px;
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 8px;
        color: #f1f5f9;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: left;
      }

      .cortex-option-btn:hover {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
      }

      .cortex-option-btn.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.2);
      }

      .cortex-option-title {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .cortex-option-desc {
        font-size: 12px;
        color: #94a3b8;
      }

      .cortex-confidence-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .cortex-confidence-btn {
        padding: 16px 12px;
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
        color: #f1f5f9;
      }

      .cortex-confidence-btn:hover {
        border-color: #6366f1;
      }

      .cortex-confidence-btn.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.2);
      }

      .cortex-confidence-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .cortex-confidence-label {
        font-size: 14px;
        font-weight: 500;
      }

      .cortex-confidence-desc {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 4px;
      }

      .cortex-helper {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 8px;
      }
    `;
  }

  setAttemptId(attemptId: string): void {
    this.currentAttemptId = attemptId;
  }

  showHotkeyModal(): void {
    if (!this.shadowRoot) return;

    const container = document.createElement('div');
    container.innerHTML = `
      <div class="cortex-modal-backdrop" id="cortex-hotkey-backdrop">
        <div class="cortex-modal">
          <div class="cortex-modal-header">
            <h2 class="cortex-modal-title">Quick Log</h2>
            <button class="cortex-modal-close" id="cortex-close-btn">&times;</button>
          </div>
          <div class="cortex-modal-body">
            <div class="cortex-entry-types" id="cortex-entry-types">
              <button class="cortex-entry-type active" data-type="thought">Thought</button>
              <button class="cortex-entry-type" data-type="stuck">Stuck</button>
              <button class="cortex-entry-type" data-type="aha">Aha!</button>
              <button class="cortex-entry-type" data-type="strategy">Strategy</button>
            </div>

            <div class="cortex-form-group">
              <label class="cortex-label" for="cortex-content">What's on your mind?</label>
              <textarea class="cortex-textarea" id="cortex-content" placeholder="Describe your thought, where you're stuck, or your breakthrough..."></textarea>
            </div>

            <div id="cortex-strategy-fields" style="display: none;">
              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-strategy-problem">What is the problem asking?</label>
                <textarea class="cortex-textarea" id="cortex-strategy-problem" placeholder="Restate the problem in your own words..."></textarea>
              </div>
              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-strategy-approach">What's your approach?</label>
                <textarea class="cortex-textarea" id="cortex-strategy-approach" placeholder="Outline your plan before coding..."></textarea>
              </div>
            </div>

            <div id="cortex-stuck-options" style="display: none;">
              <label class="cortex-label">What will you try next?</label>
              <div class="cortex-option-grid">
                <button class="cortex-option-btn" data-action="think_more">
                  <div class="cortex-option-title">Think more</div>
                  <div class="cortex-option-desc">Work through it myself</div>
                </button>
                <button class="cortex-option-btn" data-action="check_hint">
                  <div class="cortex-option-title">Check hint</div>
                  <div class="cortex-option-desc">Look at a small hint</div>
                </button>
                <button class="cortex-option-btn" data-action="ask_ai">
                  <div class="cortex-option-title">Ask AI</div>
                  <div class="cortex-option-desc">Get help from AI</div>
                </button>
                <button class="cortex-option-btn" data-action="view_solution">
                  <div class="cortex-option-title">View solution</div>
                  <div class="cortex-option-desc">Look at the answer</div>
                </button>
              </div>
            </div>
          </div>
          <div class="cortex-modal-footer">
            <button class="cortex-btn cortex-btn-secondary" id="cortex-cancel-btn">Cancel</button>
            <button class="cortex-btn cortex-btn-primary" id="cortex-save-btn">Save</button>
          </div>
        </div>
      </div>
    `;

    // Clear any existing modal
    const existing = this.shadowRoot.getElementById('cortex-hotkey-backdrop');
    if (existing) {
      existing.remove();
    }

    this.shadowRoot.appendChild(container.firstElementChild!);

    // Set up event listeners
    this.setupHotkeyModalEvents();
  }

  private setupHotkeyModalEvents(): void {
    if (!this.shadowRoot) return;

    const backdrop = this.shadowRoot.getElementById('cortex-hotkey-backdrop');
    const closeBtn = this.shadowRoot.getElementById('cortex-close-btn');
    const cancelBtn = this.shadowRoot.getElementById('cortex-cancel-btn');
    const saveBtn = this.shadowRoot.getElementById('cortex-save-btn');
    const entryTypes = this.shadowRoot.getElementById('cortex-entry-types');
    const stuckOptions = this.shadowRoot.getElementById('cortex-stuck-options');
    const strategyFields = this.shadowRoot.getElementById('cortex-strategy-fields');
    const contentInput = this.shadowRoot.getElementById('cortex-content') as HTMLTextAreaElement;
    const contentGroup = contentInput?.parentElement as HTMLElement | null;

    let selectedType: ReflectionType = 'thought';
    let selectedAction: IntendedAction | undefined;

    const close = () => backdrop?.remove();

    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    // Entry type selection
    entryTypes?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.cortex-entry-type');
      if (!target) return;

      entryTypes.querySelectorAll('.cortex-entry-type').forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');
      selectedType = target.getAttribute('data-type') as ReflectionType;

      // Show/hide stuck options
      if (stuckOptions) {
        stuckOptions.style.display = selectedType === 'stuck' ? 'block' : 'none';
      }

      // Show/hide strategy fields and generic content
      if (strategyFields) {
        strategyFields.style.display = selectedType === 'strategy' ? 'block' : 'none';
      }
      if (contentGroup) {
        contentGroup.style.display = selectedType === 'strategy' ? 'none' : 'block';
      }
    });

    // Stuck action selection
    stuckOptions?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.cortex-option-btn');
      if (!target) return;

      stuckOptions.querySelectorAll('.cortex-option-btn').forEach(btn => btn.classList.remove('selected'));
      target.classList.add('selected');
      selectedAction = target.getAttribute('data-action') as IntendedAction;
    });

    // Save
    saveBtn?.addEventListener('click', async () => {
      let content: string;

      if (selectedType === 'strategy') {
        const problemInput = this.shadowRoot?.getElementById('cortex-strategy-problem') as HTMLTextAreaElement;
        const approachInput = this.shadowRoot?.getElementById('cortex-strategy-approach') as HTMLTextAreaElement;
        const problem = problemInput?.value?.trim();
        const approach = approachInput?.value?.trim();
        if (!problem && !approach) return;
        content = `**Problem:** ${problem || '(not provided)'}\n\n**Approach:** ${approach || '(not provided)'}`;
      } else {
        content = contentInput?.value?.trim();
        if (!content) return;
      }

      // If we don't have an attemptId, try to get one now (retry START_ATTEMPT)
      if (!this.currentAttemptId) {
        console.log('Cortex Lattice: No attemptId - retrying START_ATTEMPT...');
        try {
          const retryResponse = await sendMessageWithRetry<{
            error?: string;
            attempt?: { id: string };
          }>({
            type: 'START_ATTEMPT',
            payload: {
              url: window.location.href,
              title: document.title,
              platform: window.location.hostname.includes('designgurus') ? 'grokking' : 'leetcode',
            },
          });
          if (retryResponse?.attempt?.id) {
            this.currentAttemptId = retryResponse.attempt.id;
            console.log('Cortex Lattice: Retry succeeded, got attemptId:', this.currentAttemptId);
          }
        } catch (e) {
          console.error('Cortex Lattice: Retry START_ATTEMPT failed:', e);
        }
      }

      if (!this.currentAttemptId) {
        console.error('Cortex Lattice: No attemptId set - are you logged into the web app?');
        const errorMsg = document.createElement('p');
        errorMsg.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 8px; text-align: center;';
        errorMsg.textContent = 'Not connected. Please log in at localhost:3001 and refresh this page.';
        this.shadowRoot?.querySelector('.cortex-modal-body')?.appendChild(errorMsg);
        return;
      }

      // Cast to button element to access disabled property
      const btn = saveBtn as HTMLButtonElement;

      // Disable button to prevent double-submit
      btn.disabled = true;
      btn.textContent = 'Saving...';

      try {
        const codeSnapshot = this.codeScraper?.() ?? undefined;

        if (selectedType === 'stuck' && selectedAction) {
          await sendMessageWithRetry({
            type: 'ADD_STUCK_POINT',
            payload: {
              attemptId: this.currentAttemptId,
              description: content,
              intendedAction: selectedAction,
              codeSnapshot,
            },
          });
        } else {
          await sendMessageWithRetry({
            type: 'ADD_REFLECTION',
            payload: {
              attemptId: this.currentAttemptId,
              type: selectedType,
              content,
              codeSnapshot,
            },
          });
        }
        close();
      } catch (error) {
        console.error('Cortex Lattice: Failed to save entry:', error);
        // Show error to user
        btn.textContent = 'Error - Retry';
        btn.disabled = false;

        // Show a brief error message
        const errorMsg = document.createElement('p');
        errorMsg.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 8px; text-align: center;';
        errorMsg.textContent = 'Failed to save. Please try again or refresh the page.';
        this.shadowRoot?.querySelector('.cortex-modal-footer')?.appendChild(errorMsg);
      }
    });

    // Focus input
    contentInput?.focus();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        saveBtn?.click();
      }
    }, { once: true });
  }

  showReflectionModal(
    isMultiAttempt: boolean,
    onComplete: (data: ReflectionData) => void
  ): void {
    if (!this.shadowRoot) return;

    const container = document.createElement('div');

    if (isMultiAttempt) {
      // Multi-attempt: Ask what the issue was
      container.innerHTML = `
        <div class="cortex-modal-backdrop" id="cortex-reflection-backdrop">
          <div class="cortex-modal">
            <div class="cortex-modal-header">
              <h2 class="cortex-modal-title">Nice! You solved it!</h2>
              <button class="cortex-modal-close" id="cortex-close-btn">&times;</button>
            </div>
            <div class="cortex-modal-body">
              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-issue">What was the issue?</label>
                <textarea class="cortex-textarea" id="cortex-issue" placeholder="What tripped you up? What did you miss initially?"></textarea>
              </div>

              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-hint">What hint would have helped?</label>
                <textarea class="cortex-textarea" id="cortex-hint" placeholder="Write a hint that would help you next time (no spoilers)"></textarea>
                <p class="cortex-helper">This hint will show during your next review</p>
              </div>
            </div>
            <div class="cortex-modal-footer">
              <button class="cortex-btn cortex-btn-secondary" id="cortex-skip-btn">Skip</button>
              <button class="cortex-btn cortex-btn-primary" id="cortex-save-btn">Save</button>
            </div>
          </div>
        </div>
      `;
    } else {
      // First-try success: Ask confidence
      container.innerHTML = `
        <div class="cortex-modal-backdrop" id="cortex-reflection-backdrop">
          <div class="cortex-modal">
            <div class="cortex-modal-header">
              <h2 class="cortex-modal-title">First try! How did it feel?</h2>
              <button class="cortex-modal-close" id="cortex-close-btn">&times;</button>
            </div>
            <div class="cortex-modal-body">
              <label class="cortex-label">How confident are you?</label>
              <div class="cortex-confidence-grid">
                <button class="cortex-confidence-btn" data-confidence="easy">
                  <div class="cortex-confidence-icon">😎</div>
                  <div class="cortex-confidence-label">Easy</div>
                  <div class="cortex-confidence-desc">I could do this in my sleep</div>
                </button>
                <button class="cortex-confidence-btn" data-confidence="moderate">
                  <div class="cortex-confidence-icon">🤔</div>
                  <div class="cortex-confidence-label">Moderate</div>
                  <div class="cortex-confidence-desc">Had to think, but got it</div>
                </button>
                <button class="cortex-confidence-btn" data-confidence="lucky">
                  <div class="cortex-confidence-icon">🍀</div>
                  <div class="cortex-confidence-label">Lucky</div>
                  <div class="cortex-confidence-desc">Not sure I could do it again</div>
                </button>
              </div>
            </div>
            <div class="cortex-modal-footer">
              <button class="cortex-btn cortex-btn-secondary" id="cortex-skip-btn">Skip</button>
            </div>
          </div>
        </div>
      `;
    }

    // Clear any existing modal
    const existing = this.shadowRoot.getElementById('cortex-reflection-backdrop');
    if (existing) {
      existing.remove();
    }

    this.shadowRoot.appendChild(container.firstElementChild!);

    // Set up event listeners
    this.setupReflectionModalEvents(isMultiAttempt, onComplete);
  }

  private setupReflectionModalEvents(
    isMultiAttempt: boolean,
    onComplete: (data: ReflectionData) => void
  ): void {
    if (!this.shadowRoot) return;

    const backdrop = this.shadowRoot.getElementById('cortex-reflection-backdrop');
    const closeBtn = this.shadowRoot.getElementById('cortex-close-btn');
    const skipBtn = this.shadowRoot.getElementById('cortex-skip-btn');
    const saveBtn = this.shadowRoot.getElementById('cortex-save-btn');

    const close = () => backdrop?.remove();

    closeBtn?.addEventListener('click', () => {
      onComplete({ content: 'Skipped', confidence: 'moderate' });
      close();
    });

    skipBtn?.addEventListener('click', () => {
      onComplete({ content: 'Skipped', confidence: 'moderate' });
      close();
    });

    if (isMultiAttempt) {
      saveBtn?.addEventListener('click', () => {
        const issueInput = this.shadowRoot?.getElementById('cortex-issue') as HTMLTextAreaElement;
        const hintInput = this.shadowRoot?.getElementById('cortex-hint') as HTMLTextAreaElement;

        const content = issueInput?.value?.trim() || 'No reflection provided';
        const coldHint = hintInput?.value?.trim();

        onComplete({ content, coldHint });
        close();
      });
    } else {
      // Confidence selection
      const confidenceGrid = this.shadowRoot.querySelector('.cortex-confidence-grid');
      confidenceGrid?.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.cortex-confidence-btn');
        if (!target) return;

        const confidence = target.getAttribute('data-confidence') as Confidence;
        onComplete({ content: `Confidence: ${confidence}`, confidence });
        close();
      });
    }

    // Escape to close
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete({ content: 'Skipped', confidence: 'moderate' });
        close();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  hideModal(): void {
    if (!this.shadowRoot) return;

    const hotkeyBackdrop = this.shadowRoot.getElementById('cortex-hotkey-backdrop');
    const reflectionBackdrop = this.shadowRoot.getElementById('cortex-reflection-backdrop');

    hotkeyBackdrop?.remove();
    reflectionBackdrop?.remove();
  }
}
