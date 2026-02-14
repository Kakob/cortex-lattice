# PRD: Cortex Lattice Chrome Extension

**Version:** 1.0  
**Date:** January 28, 2026  
**Status:** Planning

---

## Problem Statement

Current coding interview prep platforms (LeetCode, Grokking) let you solve problems but don't help you understand *why* you got stuck or build lasting retention. Users either:

1. Struggle alone until frustrated, then look at the solution (learn nothing)
2. Pass problems with help but can't solve similar problems cold later
3. Complete hundreds of problems but still bomb interviews

**The gap:** No tool captures the *learning process* itself—the stuck points, the "aha" moments, what hint would have actually helped.

---

## Solution

A Chrome extension that runs on top of existing platforms and:

1. **Captures** your problem-solving process (code snapshots, stuck points, reflections)
2. **Prompts** you to reflect at key moments (when stuck, when solved)
3. **Schedules** spaced repetition reviews to build retention
4. **Generates** structured data that becomes teaching content for Cortex Lattice platform

---

## Initial Curriculum Scope (v0)

For the first release of Cortex Lattice, the platform’s tracked “problem catalog” starts with **Grokking the Coding Interview (GTCI)**, using `problems/dsa-study-log.yaml` in this repo as the canonical source of truth.

- **Canonical structure**: pattern → ordered list of problems with per-problem learning fields (first attempt, bugs, peeked_at, key_insight, can_solve_cold).
- **First tracked problems (examples)**:
  - **two-pointers**: “Pair with Target Sum”, “Squaring a Sorted Array”, “Triplet Sum to Zero”, …
  - **fast-slow-pointers**: “LinkedList Cycle”, “Middle of the LinkedList”, …
  - **sliding-window**: “Maximum Sum Subarray of Size K”, “Smallest Subarray With a Greater Sum”, …

This doesn’t prevent tracking LeetCode broadly, but it makes the initial dashboard, SR, and mastery metrics curriculum-driven and immediately useful.

---

## User Persona

**Jacob (and people like him):**
- Preparing for technical interviews at top companies
- Using Grokking/LeetCode but not retaining patterns
- Wants to solve problems "cold" without relying on solutions
- Willing to invest in deliberate practice, not just volume

---

## Core User Flows

### Flow 1: Normal Problem Solving

```
1. User opens a GTCI problem (Educative/Grokking) or LeetCode
2. Extension detects platform, scrapes problem info
3. Extension attempts to map the page to a canonical GTCI entry from `dsa-study-log.yaml` (by normalized title)
3. User writes code, hits Run
4. Extension captures code snapshot
5. Tests fail → extension logs silently
6. User keeps working, hits Run again
7. Extension captures another snapshot
8. Tests pass → extension shows reflection modal
9. User notes what was tricky, what hint would have helped
10. Extension saves attempt, schedules SR review
```

### Flow 2: Getting Stuck

```
1. User is working on problem
2. User feels stuck, hits Cmd+Shift+S
3. Modal appears: "What's happening?"
4. User selects "Stuck" and describes issue
5. User indicates: "Going to ask AI"
6. Extension logs stuck point
7. User switches to ChatGPT (tab switch logged)
8. User returns, continues working
9. Tests pass → reflection modal includes "What was the issue?"
```

### Flow 3: Spaced Repetition Review

```
1. Extension shows notification: "3 problems to review"
2. User clicks notification → dashboard opens
3. Dashboard shows review queue with links
4. User clicks problem → opens in the source platform (often Educative/Grokking for GTCI)
5. User attempts cold (extension tracking)
6. If solved cold → interval increases
7. If needed help → interval resets short
```

### Flow 4: First-Try Solve

```
1. User opens problem
2. User writes solution, hits Run
3. Tests pass on first try
4. Extension shows: "First try! How did it feel?"
5. User selects: Easy / Moderate / Lucky
6. User notes which pattern they used
7. SR scheduled based on confidence
```

### Flow 5: Abandoning a Problem

```
1. User working on problem
2. User navigates away or closes tab
3. Next time user visits any supported platform:
   Extension: "You have an unfinished attempt on Two Sum"
4. User chooses: Resume / Start fresh / Mark abandoned
5. If abandoned, user selects reason (too hard, not relevant, etc.)
```

---

## Feature Requirements

### P0 (MVP - Must Have)

| Feature | Description |
|---------|-------------|
| Platform detection | Detect LeetCode and Grokking from URL |
| Problem scraping | Extract title, difficulty, URL |
| Curriculum mapping (GTCI v0) | Ship with/consume the canonical GTCI list from `problems/dsa-study-log.yaml` and map scraped problems to canonical entries by normalized title (store patternKey + index when matched) |
| Code snapshots | Capture code on Run/Submit clicks |
| Test result detection | Detect pass/fail from DOM |
| Hotkey modal | Cmd+Shift+S opens quick log modal |
| Stuck point logging | Record when user is stuck and why |
| Reflection prompts | Modal after tests pass |
| Local storage | Save all data to IndexedDB |
| Basic popup | Show today's review count |
| SR scheduling | Calculate next review date |
| Review notifications | Chrome notification when reviews due |

### P1 (Soon After MVP)

| Feature | Description |
|---------|-------------|
| Dashboard page | Full history, analytics, review queue |
| Tab switch tracking | Log when user leaves to ChatGPT, etc. |
| Export to JSON | Download all data |
| Unfinished attempt prompts | Resume or abandon modal |
| Pattern tagging | Manual tag for which pattern used |
| Dark mode | Match platform or system preference |

### P2 (Future)

| Feature | Description |
|---------|-------------|
| HackerRank support | Third platform |
| Cloud sync | Optional backup/multi-device |
| Export to YAML | Format for Cortex Lattice platform |
| Pattern auto-detect | Guess pattern from problem title/content |
| Streak tracking | Gamification for consistency |
| Analytics charts | Pattern mastery visualization |

---

## UI Specifications

### Hotkey Modal (Cmd+Shift+S)

**Default state:**
```
┌─────────────────────────────────────────┐
│  📝 Quick Log                     [Esc] │
├─────────────────────────────────────────┤
│                                         │
│  What's happening?                      │
│                                         │
│  ○ 💭 Thought / Note                    │
│  ○ 🚧 Stuck                             │
│  ○ 💡 Aha moment                        │
│  ○ 👀 About to look at hint/solution    │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Save] (Enter)          [Cancel] (Esc) │
└─────────────────────────────────────────┘
```

**Stuck state (after selecting 🚧):**
```
┌─────────────────────────────────────────┐
│  🚧 Stuck Point                   [Esc] │
├─────────────────────────────────────────┤
│                                         │
│  What are you stuck on?                 │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  What will you try?                     │
│  ○ Keep thinking (staying cold)         │
│  ○ Check platform hint                  │
│  ○ Ask AI (ChatGPT, Claude, etc.)       │
│  ○ Look at solution                     │
│                                         │
│  [Save] (Enter)          [Cancel] (Esc) │
└─────────────────────────────────────────┘
```

### Reflection Modal (After Tests Pass)

**Multi-attempt solve:**
```
┌─────────────────────────────────────────┐
│  ✓ Solved!                              │
├─────────────────────────────────────────┤
│                                         │
│  You had 4 attempts.                    │
│                                         │
│  What was the issue?                    │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  What hint would have helped without    │
│  giving away the answer?                │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Pattern used: [dropdown or text]       │
│                                         │
│  [Save]                          [Skip] │
└─────────────────────────────────────────┘
```

**First-try solve:**
```
┌─────────────────────────────────────────┐
│  ✓ First Try!                           │
├─────────────────────────────────────────┤
│                                         │
│  How did it feel?                       │
│  ○ Easy - I knew this pattern           │
│  ○ Moderate - had to think but got it   │
│  ○ Lucky - wasn't sure it would work    │
│                                         │
│  Pattern used:                          │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Save]                          [Skip] │
└─────────────────────────────────────────┘
```

### Extension Popup

```
┌───────────────────────────┐
│  Cortex Lattice      [⚙️] │
├───────────────────────────┤
│                           │
│  📊 Today                 │
│  Reviews due: 3           │
│  Completed: 1             │
│                           │
│  🔥 Streak: 5 days        │
│                           │
├───────────────────────────┤
│  [Open Dashboard]         │
│  [Start Review Session]   │
└───────────────────────────┘
```

### Dashboard (Full Page)

```
┌─────────────────────────────────────────────────────────────┐
│  Cortex Lattice Dashboard                              [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  Today's Reviews    │  │  Stats                      │  │
│  │                     │  │                             │  │
│  │  🔴 Pair w/ Target Sum│ │  Total problems: 47        │  │
│  │     Due now         │  │  Cold solve rate: 34%       │  │
│  │                     │  │  Current streak: 5 days     │  │
│  │  🟡 Valid Parens    │  │                             │  │
│  │     Due in 2 hours  │  │  Strongest: Sliding Window  │  │
│  │                     │  │  Weakest: Dynamic Prog      │  │
│  │  🟡 Container Water │  │                             │  │
│  │     Due today       │  │                             │  │
│  │                     │  │                             │  │
│  │  [Start Review]     │  │                             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Recent Activity                                     │  │
│  │                                                      │  │
│  │  Today                                               │  │
│  │  ✓ Merge Intervals - solved cold (3 min)            │  │
│  │  ✗ LRU Cache - needed solution                      │  │
│  │                                                      │  │
│  │  Yesterday                                           │  │
│  │  ✓ Two Pointers #3 - solved with hint (12 min)      │  │
│  │  ✓ Binary Search #1 - solved cold (5 min)           │  │
│  │                                                      │  │
│  │  [View Full History]           [Export Data (JSON)]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Spaced Repetition Algorithm

### Initial Interval (after first solve)

| Solve Type | Initial Interval |
|------------|------------------|
| First-try, felt "Easy" | 4 days |
| First-try, felt "Moderate" | 3 days |
| First-try, felt "Lucky" | 1 day |
| Multi-attempt, solved cold | 2 days |
| Multi-attempt, checked hint | 1 day |
| Multi-attempt, asked AI | 12 hours |
| Multi-attempt, saw solution | 4 hours |

### On Review

| Review Result | Interval Change | Ease Factor Change |
|---------------|-----------------|-------------------|
| Cold solve | interval × easeFactor | +0.1 (max 3.0) |
| Needed hint | interval = 1 day | -0.1 |
| Needed AI | interval = 12 hours | -0.2 |
| Needed solution | interval = 4 hours | -0.3 |
| Failed/abandoned | interval = 4 hours | -0.3 |

**Minimum ease factor:** 1.3

---

## Data Export Format

### JSON Export (for backup)

```json
{
  "exportDate": "2025-01-28T12:00:00Z",
  "version": "1.0",
  "problems": [...],
  "attempts": [...],
  "snapshots": [...],
  "stuckPoints": [...],
  "reflections": [...],
  "spacedRepetition": [...],
  "reviews": [...]
}
```

### YAML Export (for Cortex Lattice platform - future)

```yaml
# Auto-generated from extension data
problems:
  - id: gtci/two-pointers/01-pair-with-target-sum
    title: "Pair with Target Sum"
    pattern: "two-pointers"
    attempts: 3
    cold_solve_rate: 0.67
    
    common_stuck_points:
      - "didn't think of using hash map"
      - "off by one in loop"
    
    helpful_hints:
      - t1: "What data structure gives O(1) lookup?"
      - t2: "Store what you've seen as you iterate"
```

---

## Success Metrics

### Week 1
- [ ] Extension installs and runs on LeetCode
- [ ] Can capture code snapshots on Run/Submit
- [ ] Can detect test pass/fail
- [ ] Hotkey modal works
- [ ] Data persists in IndexedDB

### Month 1
- [ ] Used for 50+ problems personally
- [ ] SR scheduling working correctly
- [ ] Dashboard shows meaningful stats
- [ ] Exported data is clean and usable

### Month 3
- [ ] 150 problems completed with full data
- [ ] Can generate guidance.yaml from export
- [ ] Cold solve rate measurably improved
- [ ] Ready to share extension with beta users

---

## Technical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LeetCode DOM changes | Medium | High | Abstract scraping logic, fail gracefully, alert user |
| IndexedDB storage limits | Low | Medium | Compress old snapshots, offer export |
| Chrome manifest V3 limitations | Low | Medium | Research limitations early |
| Modal injection conflicts with platform | Medium | Low | Use shadow DOM, minimal styling |

---

## Open Questions

1. **Pattern tagging:** Manual entry or dropdown of known patterns?
2. **Multiple accounts:** If user has LeetCode premium and free, how to handle?
3. **Mobile:** Any consideration for mobile LeetCode app? (Probably not MVP)
4. **Sharing:** Any way to share hints with friends? (Future feature)

---

## Development Phases

### Phase 1: Core Capture (Week 1-2)
- Extension scaffolding
- LeetCode content script
- Snapshot capture
- Basic storage

### Phase 2: Modals & Reflection (Week 2-3)
- Hotkey modal
- Reflection modal after solve
- Stuck point logging

### Phase 3: Spaced Repetition (Week 3-4)
- SR algorithm
- Review scheduling
- Notifications
- Basic popup

### Phase 4: Dashboard (Week 4-5)
- Full dashboard page
- History view
- Export functionality

### Phase 5: Polish & Grokking (Week 5-6)
- Grokking support
- Bug fixes
- Performance optimization
- Documentation

---

## Appendix: Supported Platforms

### MVP
- LeetCode (leetcode.com)
- Grokking / Educative (educative.io)

### Future
- HackerRank
- CodeSignal
- AlgoExpert
- NeetCode

---

*This PRD is a living document. Update as decisions are made and requirements evolve.*
