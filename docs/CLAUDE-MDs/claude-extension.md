# Cortex Lattice Extension - Claude.md

## Project Overview

Cortex Lattice Extension is a Chrome extension that captures a user's problem-solving process while they work through coding challenges on platforms like LeetCode and Grokking the Coding Interview. The extension tracks code snapshots, stuck points, reflections, and manages spaced repetition for problem review.

**Core insight:** The value isn't the problems themselves—it's the structured data about how the user struggled and what hints would have helped them at each stuck point.

## Initial Curriculum (v0): Grokking the Coding Interview

For the first version of Cortex Lattice, the platform’s “problem catalog” is the Grokking the Coding Interview (GTCI) curriculum defined in this repo at `problems/dsa-study-log.yaml`.

- **What this means**: the extension should treat GTCI problems as *canonical* entries (pattern + ordered index), and map whatever it scrapes (Educative/Grokking page title + URL) onto that canonical entry when possible.
- **Why**: it lets the product show “Next up” in the Grokking sequence, compute pattern mastery, and keep a single progress record even if the same problem appears across sources.
- **Patterns in v0** (from `dsa-study-log.yaml`): `two-pointers`, `fast-slow-pointers`, `sliding-window`, `merge-intervals`, `cyclic-sort`, `linked-list-reversal`, `binary-search`, `tree-bfs`, `tree-dfs`, `two-heaps`, `subsets`, `top-k-elements`, `k-way-merge`, `topological-sort`, `dynamic-programming`, `graph-bfs-dfs`, `islands`, `backtracking`, `trie`, `union-find`, `monotonic-stack`, `bitwise-xor`.

## Tech Stack

- **Chrome Extension Manifest V3**
- **TypeScript** for type safety
- **IndexedDB** (via Dexie.js) for local storage
- **React** for popup and dashboard UI
- **Tailwind CSS** for styling

## Architecture

```
/src
  /background
    service-worker.ts       # Background script - storage, SR scheduling, message handling
  /content
    detector.ts             # Detects platform (leetcode, grokking, etc.)
    scraper-leetcode.ts     # LeetCode-specific DOM scraping
    scraper-grokking.ts     # Grokking-specific DOM scraping
    observer.ts             # Watches for Run/Submit clicks, test results
    modal.ts                # Injects hotkey modals into page
  /popup
    Popup.tsx               # Quick status view when clicking extension icon
  /dashboard
    Dashboard.tsx           # Full-page review queue, history, analytics
  /db
    schema.ts               # Dexie database schema
    operations.ts           # CRUD operations for attempts, snapshots, etc.
  /types
    index.ts                # TypeScript interfaces matching data schema
  /utils
    spaced-repetition.ts    # SR algorithm (interval calculation)
    export.ts               # Export data to JSON/YAML
```

## Data Schema

### Core Entities

```typescript
interface Problem {
  id: string;                    // stable canonical ID (prefer curriculum-based when available)
  platform: 'leetcode' | 'grokking' | 'hackerrank';
  url: string;
  title: string;
  pattern?: string;              // "two-pointers" | "sliding-window" | etc
  difficulty?: 'easy' | 'medium' | 'hard';
  firstSeen: number;             // timestamp

  // Optional: map this scraped page to a canonical curriculum entry.
  // For v0, this is primarily GTCI from `problems/dsa-study-log.yaml`.
  curriculum?: {
    track: 'gtci';
    patternKey: string;          // e.g. "two-pointers"
    index: number;               // 1-based index within the pattern list
    canonicalTitle: string;      // e.g. "Pair with Target Sum"
  };
}

interface Attempt {
  id: string;
  visibleId?: string;            // user-facing ID, e.g. "LL-123"
  problemId: string;
  startedAt: number;
  completedAt?: number;
  status: 'in_progress' | 'completed' | 'abandoned' | 'skipped';
  passed: boolean;
  
  abandonedAt?: number;
  abandonReason?: 'too_hard' | 'out_of_time' | 'lost_interest' | 'will_return';
  skipReason?: 'already_know' | 'too_easy' | 'not_relevant' | 'saving_for_later';
}

interface Snapshot {
  id: string;
  attemptId: string;
  timestamp: number;
  trigger: 'run' | 'submit' | 'manual';
  code: string;
  testResult?: 'pass' | 'fail' | 'error';
  errorMessage?: string;
}

interface StuckPoint {
  id: string;
  attemptId: string;
  timestamp: number;
  description: string;           // "not sure when to stop loop"
  intendedAction: 'think_more' | 'check_hint' | 'ask_ai' | 'view_solution';
}

interface Reflection {
  id: string;
  attemptId: string;
  timestamp: number;
  type: 'thought' | 'aha' | 'stuck_resolved' | 'first_try' | 'post_solve';
  content: string;
  coldHint?: string;             // "what hint would have helped?"
}

interface TabSwitch {
  id: string;
  attemptId: string;
  timestamp: number;
  fromUrl: string;
  toUrl: string;
}

interface SpacedRepetition {
  problemId: string;
  nextReview: number;            // timestamp
  intervalDays: number;
  easeFactor: number;            // multiplier, starts at 2.5
}

interface Review {
  id: string;
  visibleId?: string;            // user-facing ID
  problemId: string;
  date: number;
  result: 'cold_solve' | 'needed_help' | 'failed';
  timeSpent: number;             // seconds
}
```

## Key Features

### 1. Automatic Detection & Capture

**Content script detects:**
- Platform (LeetCode, Grokking, HackerRank) from URL
- Problem info (title, difficulty) from DOM
- Run/Submit button clicks
- Test results (pass/fail) from DOM mutations
- Tab switches away from problem

**On Run/Submit click:**
1. Capture current code from editor
2. Send snapshot to background script
3. Wait for test results
4. If all tests pass → trigger reflection modal

### 2. Hotkey Modal System

**Cmd+Shift+S (or Ctrl+Shift+S on Windows)** opens quick log modal:

```
┌─────────────────────────────────────────┐
│  📝 Log Entry                     [Esc] │
├─────────────────────────────────────────┤
│  ○ 💭 Thought / Note                    │
│  ○ 🚧 Stuck                             │
│  ○ 💡 Aha moment                        │
│  ○ 👀 About to look at hint/solution    │
│                                         │
│  [Text input field]                     │
│                                         │
│  [Save + Continue] (Enter)              │
└─────────────────────────────────────────┘
```

**If "Stuck" selected:** Additional fields for description and intended action.

**On all tests pass:** Automatic reflection modal asking what was tricky and what hint would have helped.

### 3. Spaced Repetition

**Algorithm:**
```
First solve:
  - First-try cold solve → interval = 3 days
  - Struggled (3+ attempts) → interval = 1 day
  - Needed solution → interval = 4 hours

On review:
  - Cold solve → interval *= easeFactor (2.5)
  - Needed help → interval = 1 day, easeFactor -= 0.2
  - Failed → interval = 4 hours, easeFactor -= 0.3

Min easeFactor = 1.3
```

**Background script:**
- Checks every hour for due reviews
- Shows Chrome notification when reviews are due

### 4. Dashboard

Full-page dashboard (opens in new tab) showing:
- Today's review queue
- Problem history with attempt details
- Pattern mastery chart (which patterns solved cold vs struggled)
- Export to JSON/YAML

## Content Script Platform Detection

Each platform needs custom scraping logic:

### LeetCode
```typescript
// Detect: url includes 'leetcode.com/problems/'
// Title: document.querySelector('[data-cy="question-title"]')
// Difficulty: document.querySelector('[diff]')
// Code editor: Monaco editor instance
// Run button: document.querySelector('[data-cy="run-code-btn"]')
// Submit button: document.querySelector('[data-cy="submit-code-btn"]')
// Test results: Observe '.result-container' mutations
```

### Grokking (Educative.io)
```typescript
// Detect: url includes 'educative.io' and path includes 'grokking'
// Title: document.querySelector('.lesson-title') or similar
// Code editor: CodeMirror or Monaco instance
// Run button: Button with 'Run' text
// Test results: Observe output panel mutations
```

**Curriculum mapping (GTCI v0):**

- Normalize scraped title (trim, collapse whitespace, case-fold) and match against the `canonicalTitle` list from `problems/dsa-study-log.yaml`.
- If matched, set `problem.curriculum` and prefer a stable ID such as:
  - `gtci/<patternKey>/<index>-<slugified-title>` (example: `gtci/two-pointers/01-pair-with-target-sum`)
- If not matched, fall back to a platform-derived ID (e.g. `grokking/<slug>`), but keep the raw title + URL so it can be mapped later.

## Message Passing

Content script → Background script:

```typescript
// Snapshot
chrome.runtime.sendMessage({
  type: 'SNAPSHOT',
  attemptId: string,
  code: string,
  trigger: 'run' | 'submit'
})

// Test result
chrome.runtime.sendMessage({
  type: 'TEST_RESULT',
  attemptId: string,
  result: 'pass' | 'fail' | 'error',
  errorMessage?: string
})

// Stuck point
chrome.runtime.sendMessage({
  type: 'STUCK_POINT',
  attemptId: string,
  description: string,
  intendedAction: string
})

// Reflection
chrome.runtime.sendMessage({
  type: 'REFLECTION',
  attemptId: string,
  type: string,
  content: string,
  coldHint?: string
})

// Tab switch
chrome.runtime.sendMessage({
  type: 'TAB_SWITCH',
  attemptId: string,
  fromUrl: string,
  toUrl: string
})
```

Background script → Content script:

```typescript
// Trigger reflection modal (after tests pass)
chrome.tabs.sendMessage(tabId, {
  type: 'SHOW_REFLECTION_MODAL',
  attemptId: string,
  attemptCount: number  // to know if first-try
})

// Prompt about unfinished attempt
chrome.tabs.sendMessage(tabId, {
  type: 'SHOW_RESUME_MODAL',
  attemptId: string,
  problemTitle: string,
  lastActive: number
})
```

## Styling Guidelines

- Modals should be minimal, non-intrusive
- Use system fonts, match platform look where possible
- Dark mode support (detect from platform or system preference)
- Hotkey hint shown subtly in corner when on supported platform

## Error Handling

- If DOM scraping fails, log error but don't crash
- If storage write fails, queue for retry
- If platform DOM changes, fail gracefully and notify user to report issue

## Privacy Considerations

- All data stored locally by default
- No data sent to any server in MVP
- Export feature lets user own their data
- Clear data option in settings

## Testing

- Unit tests for SR algorithm
- Unit tests for data operations
- Manual testing on LeetCode and Grokking for scraper reliability

## Future Considerations (Not MVP)

- Cloud sync for multi-device
- AI-powered cold hints based on collected data
- Share anonymized hints with community
- Support for more platforms (HackerRank, CodeSignal)
- Pattern auto-detection from problem content
