# Product Requirements Document: Cortex Lattice MVP

**Product:** Cortex Lattice - AI Safety Learning Platform  
**Version:** 1.0 (MVP)  
**Date:** January 26, 2026  
**Owner:** Jacob  
**Target Launch:** Week 1 MVP (February 2026)

---

## Executive Summary

Cortex Lattice teaches data structures and algorithms through the lens of AI safety research. Instead of generic coding problems, students solve challenges that map directly to implementing frontier AI papers - from transformers to RLHF to Constitutional AI.

**The Problem:**
- Reading AI safety papers is intimidating without strong algorithmic foundations
- Traditional DSA platforms (LeetCode) don't connect patterns to real research
- Students don't know which algorithms they need to implement papers

**The Solution:**
- DSA problems themed around AI safety papers you want to implement
- Each problem explicitly shows: "You'll use this pattern in Paper X, Section Y"
- Progressive hint system that teaches the pattern, not just the solution
- Mobile-first experience with iOS-style bottom sheet hints

**Target Users (MVP):**
- CS students wanting to break into AI safety
- ML engineers pivoting to alignment research
- Researchers learning algorithmic foundations
- FAANG/trading firm candidates with AI safety focus

---

## Product Vision

### The Big Picture
By Year 1, Cortex Lattice becomes **the** platform for learning AI safety through code - where you solve algorithmic problems, learn transferable patterns, then implement the actual papers with confidence.

### MVP Scope (Week 1)
5 problems covering the foundational patterns needed for Mini-GPT and PPO implementations. Focused on proving the core learning experience works.

### Month 1 Scope
14 problems - one per AI safety paper in your learning roadmap. Demonstrates the full breadth of the platform.

### Month 3 Scope
28 problems - two per paper. This is the complete "Foundations" tier that teaches all patterns needed for AI safety work.

---

## User Personas

### Primary: "Alex the Aspiring AI Safety Researcher"
- **Background:** CS undergrad, strong programming, some ML coursework
- **Goal:** Land internship at Anthropic, OpenAI, or Redwood Research
- **Pain Point:** "I understand transformers conceptually but struggle implementing them"
- **Motivation:** Wants to contribute to AI alignment but needs stronger foundations
- **Use Case:** Solves 2-3 problems per week while reading corresponding papers

### Secondary: "Sam the Self-Taught ML Engineer"
- **Background:** Software engineer, learned ML through online courses
- **Goal:** Transition from web dev to ML engineering at a top lab
- **Pain Point:** "My DSA skills are rusty and I don't see how they connect to ML"
- **Motivation:** Building portfolio of implemented papers to show competency
- **Use Case:** Uses platform to learn patterns, then implements full papers

### Tertiary: "Riley the Research Engineer"
- **Background:** PhD in ML, works at frontier lab
- **Goal:** Stay sharp on algorithms, learn new papers efficiently
- **Pain Point:** "Reading papers is slow - I want hands-on practice fast"
- **Motivation:** Efficient learning, pattern recognition across papers
- **Use Case:** Solves 1 problem when reading each new paper

---

## Core User Journey (MVP)

### Discovery
```
User finds Cortex Lattice via:
- Twitter thread: "Learning AI safety? Start here..."
- AI safety Slack/Discord communities
- r/machinelearning, r/MLQuestions
- Alignment Forum, LessWrong
```

### First Session (Mobile)
```
1. User opens site on phone
   → Sees: "Learn AI Safety Through Code"
   → Browse problems by paper

2. Taps: "Two Pointers - Attention Head Selector"
   → Reads problem statement
   → Sees: "You'll use this in: Mini-GPT attention layer"
   
3. Starts coding in full-screen editor
   → Types solution
   → Gets stuck

4. Swipes up → Bottom sheet appears
   → Taps "🤖 Project Context"
   → Reveals hint: "When you build Mini-GPT, this is how
                    Flash Attention optimizes Q-K pairs..."
   → Aha moment: "Oh, this is why I need this pattern!"

5. Finishes problem
   → Tests pass: 5/5 ✓
   → Pattern unlocked: "Two Pointers"
   → Sees next problem: "Sliding Window - PPO Experience Buffer"
```

### Learning Journey
```
Week 1: Solve 3 problems (Mini-GPT focused)
        → Learns: Two Pointers, Dynamic Programming, Sliding Window
        → Confidence: "I can implement attention now"

Week 2: Starts implementing Mini-GPT
        → Uses pattern from problem #1 in attention.py
        → Success: Code works, understands WHY

Week 3: Solves 2 more problems (PPO focused)
        → Learns: Monotonic Stack, Priority Queue
        → Starts implementing PPO

Week 4: Posts on Twitter:
        "Just implemented Mini-GPT from scratch using @CortexLattice!
         The DSA → Paper connection is 🔥"
```

---

## Feature Specifications (MVP)

### Feature 1: Mobile-First Problem Interface

**User Story:**
As a student, I want to solve coding problems on my phone during commutes so I can learn efficiently anywhere.

**Requirements:**
- Full-screen code editor optimized for mobile
- Bottom sheet hint system (iOS Now Playing style)
- Syntax highlighting for Python
- Test execution with clear pass/fail results
- Responsive design (works on phone, tablet, desktop)

**Acceptance Criteria:**
- [ ] Code editor uses full screen on mobile (no wasted space)
- [ ] Bottom sheet smoothly swipes up/down
- [ ] All 5 hint categories accessible via bottom sheet
- [ ] Test results display clearly on small screens
- [ ] Works on iOS Safari and Chrome Android

**Technical Notes:**
- Use CodeMirror 6 for mobile (lighter than Monaco)
- Bottom sheet uses `framer-motion` for smooth animations
- Touch gestures: swipe up/down, tap to expand categories

---

### Feature 2: Categorized Hint System

**User Story:**
As a learner, I want different types of hints so I can choose what kind of help I need without spoiling the full solution.

**Requirements:**
- 5 distinct hint categories:
  1. 💡 Key Concepts (algorithmic fundamentals)
  2. ⚠️ Common Mistakes (pitfalls to avoid)
  3. 🤖 Project Context (where this appears in papers)
  4. 📄 Paper Reference (citations and sections)
  5. 🎯 Solution Approach (step-by-step solution)

- Progressive reveal within each category
- Clear indication of hints remaining
- Ability to reset category and try again

**Acceptance Criteria:**
- [ ] All 5 categories display in bottom sheet
- [ ] User can expand any category independently
- [ ] Hints reveal one at a time within category
- [ ] "Project Context" shows specific paper + section
- [ ] "Paper Reference" includes clickable citations
- [ ] Mobile and desktop layouts work smoothly

**UI Behavior:**
```
Initial: All categories collapsed, show hint count
Expand: Category opens, "Show first hint" button
Reveal: Hint appears with fade-in animation
Progress: "2/4 hints shown" indicator
Complete: "All hints shown ✓" with reset option
```

---

### Feature 3: Project Context Hints (Secret Sauce)

**User Story:**
As someone learning AI safety, I want to know exactly where I'll use each algorithm so I understand why I'm learning it.

**Requirements:**
- Each problem links to specific paper implementation
- Hints explain: "In Paper X, Section Y, you'll write this code..."
- Shows real use cases from frontier labs
- Connects pattern to actual research (Flash Attention, InstructGPT, etc.)
- Conceptual for MVP (ready to add code snippets later)

**Acceptance Criteria:**
- [ ] Every problem has 1-2 "Project Context" hints
- [ ] Hints reference specific paper sections
- [ ] Mentions real systems (GPT-4, Claude, Llama 3)
- [ ] Explains why this pattern matters for that paper
- [ ] Designed for easy addition of code snippets post-MVP

**Example Hint:**
```
🤖 Mini-GPT Attention Layer

When you implement your transformer, computing attention for
all query-key pairs is O(n²). This two pointers + heap pattern
lets you select only top-k pairs, reducing to O(nk).

This is how Flash Attention achieves 3-5x speedup!

You'll implement this in: src/attention.py
Paper section: "Attention is All You Need", §3.2
Used by: GPT-4 sparse attention, Llama 3 grouped-query attention
```

---

### Feature 4: Paper Reference Hints

**User Story:**
As a researcher, I want direct citations to papers so I can dive deeper into the theory behind each problem.

**Requirements:**
- Each problem links to 1-2 key papers
- Cites specific sections (e.g., "Section 3.2")
- Includes arxiv links, blog posts, code repos
- Explains what to look for in that section

**Acceptance Criteria:**
- [ ] Every problem has 1 "Paper Reference" hint
- [ ] Includes: Paper title, authors, year
- [ ] Cites specific section numbers
- [ ] Links to arxiv, blog posts, or official repos
- [ ] Explains what algorithm/concept to focus on

**Example Hint:**
```
📄 Flash Attention: Fast and Memory-Efficient Exact Attention
Dao et al., 2022 (NeurIPS)

Section 3.2: "Block-Sparse Attention Selection"

Quote: "We maintain top-k query-key pairs using a priority
        queue during block-wise computation..."

Algorithm 2 (page 6) shows the exact two-pointers implementation.

Read paper: arxiv.org/abs/2205.14135
Blog post: ai.stanford.edu/blog/flash-attention
```

---

### Feature 5: Code Execution Environment

**User Story:**
As a student, I want to run my code and get instant feedback so I can iterate quickly.

**Requirements:**
- Sandboxed Python execution (Docker)
- 10-second timeout per submission
- 512MB memory limit
- Support for PyTorch (for AI-specific problems)
- Clear pass/fail results with expected vs actual output

**Acceptance Criteria:**
- [ ] User clicks "Run Tests" → results in <5 seconds
- [ ] Shows: "Test 3/5 passed ✓"
- [ ] Failed tests show: expected output vs actual output
- [ ] Runtime errors display clearly
- [ ] Can't access network, filesystem, or other users' data
- [ ] PyTorch imports work (for ML problems)

**Technical Details:**
```
Execution flow:
1. User code → API endpoint
2. API writes code to temp file
3. Docker container executes with test cases
4. Results returned as JSON
5. Display in UI with clear formatting

Security:
- Network isolated (--network=none)
- Memory limited (--memory=512m)
- CPU limited (--cpus=1)
- No persistent storage
- 10-second timeout
```

---

### Feature 6: Problem Browser

**User Story:**
As a learner, I want to browse problems by paper or pattern so I can find what I need to learn next.

**Requirements:**
- List all problems grouped by paper
- Show pattern tags (Two Pointers, Dynamic Programming, etc.)
- Indicate difficulty (Easy, Medium, Hard)
- Show completion status (locked, in progress, solved)
- Mobile-friendly card layout

**Acceptance Criteria:**
- [ ] Problems grouped by paper theme
- [ ] Each card shows: title, pattern, difficulty
- [ ] Solved problems marked with ✓
- [ ] Click card → opens problem page
- [ ] Works smoothly on mobile

**UI Layout (Mobile):**
```
┌────────────────────────────────┐
│ Cortex Lattice                 │
│ AI Safety Learning Platform    │
├────────────────────────────────┤
│                                │
│ Prerequisites                  │
│ ┌────────────────────────────┐ │
│ │ Mini-GPT (Attention Paper) │ │
│ │ 2 problems • 1 solved ✓    │ │
│ │                            │ │
│ │ ○ Two Pointers - Attention │ │
│ │   Head Selector [Medium]   │ │
│ │                            │ │
│ │ ✓ Dynamic Programming -    │ │
│ │   Positional Encoding      │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ PPO (Policy Optimization)  │ │
│ │ 2 problems • 0 solved      │ │
│ └────────────────────────────┘ │
│                                │
│ Foundations                    │
│ ┌────────────────────────────┐ │
│ │ InstructGPT (RLHF)         │ │
│ │ 2 problems • 0 solved      │ │
│ └────────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

---

## Problem Content Structure

### The 3-File System (MVP)

Each problem consists of 3 files that take ~3 hours to create:

**1. problem.yaml** (30 minutes)
```yaml
id: "two-pointers-attention-head-selector"
title: "Two Pointers - Attention Head Selector"
difficulty: "medium"
pattern: ["Two Pointers", "Heap"]

description: |
  You're optimizing transformer attention computation.
  Given sorted arrays of query and key similarity scores,
  find the top-k query-key pairs most worth computing.

  This problem teaches the core optimization used in
  Flash Attention and sparse attention mechanisms.

project_mapping:
  paper: "Attention is All You Need"
  implementation: "Mini-GPT from Scratch"
  section: "3.2 - Multi-Head Attention"
  file: "src/attention.py"
  function: "compute_selective_attention"

examples:
  - input:
      queries: [0.1, 0.3, 0.5, 0.7, 0.9]
      keys: [0.2, 0.4, 0.6, 0.8]
      k: 3
    output: [[0.9, 0.8], [0.7, 0.8], [0.7, 0.6]]
    explanation: "Top 3 pairs by q·k dot product"

constraints:
  - "1 <= len(queries), len(keys) <= 1000"
  - "1 <= k <= len(queries) * len(keys)"
  - "Scores are sorted in ascending order"
  - "All scores are unique"

starter_code:
  python: |
    from typing import List, Tuple
    
    def find_top_k_pairs(
        queries: List[float],
        keys: List[float],
        k: int
    ) -> List[Tuple[float, float]]:
        """
        Find top-k query-key pairs by similarity score.
        
        Args:
            queries: Sorted array of query scores
            keys: Sorted array of key scores
            k: Number of top pairs to return
            
        Returns:
            List of (query, key) tuples with highest q·k scores
        """
        # Your code here
        pass

test_cases:
  - input:
      queries: [0.1, 0.5, 0.9]
      keys: [0.2, 0.6]
      k: 2
    expected: [[0.9, 0.6], [0.9, 0.2]]
  
  - input:
      queries: [1, 2, 3, 4, 5]
      keys: [1, 2, 3]
      k: 3
    expected: [[5, 3], [5, 2], [4, 3]]
  
  # ... more test cases
```

**2. solution.py** (45 minutes)
```python
from typing import List, Tuple
import heapq

def find_top_k_pairs(
    queries: List[float],
    keys: List[float],
    k: int
) -> List[Tuple[float, float]]:
    """
    Two Pointers + Min Heap approach.
    
    Time: O(n log k) where n = len(queries) + len(keys)
    Space: O(k) for the heap
    
    Strategy:
    1. Use two pointers starting at highest values (ends of sorted arrays)
    2. Maintain min-heap of size k
    3. Consider candidates by moving pointers intelligently
    4. Keep only top-k pairs in heap
    """
    
    # Min heap: stores (score, query, key)
    # We keep smallest k items, but want largest k scores
    heap = []
    
    # Start from highest values (end of sorted arrays)
    i = len(queries) - 1  # Points to largest query
    
    # For each query (starting from largest)
    while i >= 0 and len(heap) < k:
        j = len(keys) - 1  # Start from largest key
        
        # Consider pairs with this query
        while j >= 0:
            score = queries[i] * keys[j]
            
            if len(heap) < k:
                # Heap not full, add this pair
                heapq.heappush(heap, (score, queries[i], keys[j]))
                j -= 1
            else:
                # Heap full, only add if better than minimum
                if score > heap[0][0]:
                    heapq.heapreplace(heap, (score, queries[i], keys[j]))
                    j -= 1
                else:
                    # All remaining pairs with this query will be smaller
                    break
        
        i -= 1
    
    # Extract pairs from heap (without scores)
    result = [(q, k) for score, q, k in heap]
    
    # Sort by score descending (optional, for consistent output)
    result.sort(reverse=True, key=lambda pair: pair[0] * pair[1])
    
    return result
```

**3. guidance.yaml** (90 minutes)
```yaml
title: "Two Pointers - Attention Head Selector"
pattern: "Two Pointers + Min Heap"

hints:
  key_concepts:
    - text: |
        Start with two pointers at the END of both arrays (highest values).
        The largest products come from multiplying large numbers together.
    
    - text: |
        Use a min-heap of size k. The heap stores the SMALLEST k items
        we've seen, but those are the largest k values overall.
    
    - text: |
        For each query (starting from largest), iterate through keys
        (starting from largest) until the products become too small.
    
    - text: |
        Time complexity: O(n log k) where n = len(queries) + len(keys)
        This beats brute force O(n²) when k is small (e.g., k=32, n=512)

  common_mistakes:
    - text: |
        ⚠️ Don't compute all n² pairs! That's O(n² log n) to sort them.
        The two pointers approach is much faster when k << n².
    
    - text: |
        ⚠️ Remember: min-heap keeps SMALLEST k items. If you want
        largest k items, the heap paradoxically stores your smallest.
    
    - text: |
        ⚠️ When heap is full and new score < heap[0], all remaining
        pairs with current query will also be smaller. Break early!

  project_context:
    - text: |
        🤖 Mini-GPT Attention Layer
        
        When you implement self-attention, the naive approach computes
        attention scores for ALL query-key pairs:
        
        attention_scores = query @ key.transpose(-2, -1)  # O(n²)
        
        For a 512-token sequence, that's 262,144 scores to compute!
        
        Flash Attention uses this two-pointers pattern to select only
        the top-k most relevant pairs before computing attention.
        
        With k=32: only 16,384 scores needed (16x speedup!)
        
        You'll implement this in: src/attention.py
        Function: compute_selective_attention()
    
    - text: |
        🤖 Real-World Impact
        
        Mini-GPT specs:
        - Sequence length: 512 tokens
        - Embedding dim: 768
        - Attention heads: 12
        
        Full attention: 512² = 262K pairs per head
        Top-32 sparse: 512×32 = 16K pairs per head
        
        Savings: 246K fewer operations per head
        × 12 heads = 2.95M fewer operations per layer
        × 12 layers = 35.4M operations saved per forward pass!
        
        This is how production LLMs handle long contexts efficiently.

  paper_reference:
    - text: |
        📄 Flash Attention: Fast and Memory-Efficient Exact Attention
        Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra, Christopher Ré
        NeurIPS 2022
        
        Section 3.2: "Block-Sparse Attention"
        Algorithm 2 (page 6): Top-k selection using priority queue
        
        Key quote: "We maintain the top-k query-key pairs using a
        priority queue during block-wise attention computation, reducing
        the number of attention scores from O(n²) to O(nk)."
        
        This exact pattern appears in their CUDA kernel implementation.
        
        📎 Resources:
        - Paper: arxiv.org/abs/2205.14135
        - Blog: ai.stanford.edu/blog/flash-attention
        - Code: github.com/HazyResearch/flash-attention

  solution_approach:
    steps:
      - "Create min-heap to store (score, query, key) tuples"
      - "Initialize pointers: i = len(queries)-1, j = len(keys)-1"
      - "For each query (starting from largest):"
      - "  For each key (starting from largest):"
      - "    Calculate score = queries[i] * keys[j]"
      - "    If heap has < k items: add this pair"
      - "    Elif score > heap[0]: replace minimum with this pair"
      - "    Else: break (all remaining keys will be smaller)"
      - "  Move to next query: i -= 1"
      - "Extract pairs from heap and return"

complexity:
  time: "O((n+m) log k) where n=len(queries), m=len(keys), k=result size"
  space: "O(k) for heap storage"

alternative_approaches:
  - name: "Brute Force"
    time: "O(nm log(nm))"
    why_worse: "Computes all n×m pairs, then sorts. Much slower for large inputs."
  
  - name: "Binary Search"
    time: "O(nm log k)"
    why_worse: "Still computes all pairs. Two pointers avoids this."
```

**Total Time Per Problem: 2.5-3 hours**

---

## MVP Success Metrics

### Week 1 Metrics (5 Problems)

**Completion:**
- [ ] All 5 problems created with 3 files each
- [ ] Mobile UI works smoothly (tested on iPhone and Android)
- [ ] Code execution returns results in <5 seconds
- [ ] All hint categories display correctly

**User Testing:**
- [ ] 5 beta testers complete at least 1 problem
- [ ] 3+ testers solve problem using only hints (no external help)
- [ ] 4+ testers rate "Project Context" hints as valuable
- [ ] Mobile UX rated 4+/5 by testers

**Technical:**
- [ ] Docker execution works reliably
- [ ] No security issues (network isolation, memory limits work)
- [ ] PyTorch imports successfully in executor

---

### Month 1 Metrics (14 Problems)

**Growth:**
- 50+ registered users (email signup)
- 200+ problem attempts
- 70%+ completion rate on attempted problems
- 10+ users solve 3+ problems

**Engagement:**
- Average 3-4 hints used per solved problem
- "Project Context" category opened 80% of the time
- Users spending 15-30 minutes per problem
- 30%+ return rate (come back for second problem)

**Validation:**
- 5+ users successfully implement a paper after solving related problems
- Positive feedback on pattern → paper connection
- Users recommend to friends (measured via source tracking)

---

### Month 3 Metrics (28 Problems)

**Scale:**
- 500+ registered users
- 5,000+ problem attempts
- All 7 themes represented with 2+ problems each
- 50+ users solve 10+ problems

**Learning Outcomes:**
- 80%+ solve rate after using hints
- Users report understanding pattern transfer
- 20+ users share "I implemented X paper!" posts
- Pattern mastery correlates with paper implementation success

**Community:**
- 100+ active weekly users
- 10+ user-submitted problem suggestions
- Discussion threads have meaningful engagement
- First paid subscribers ($20/month tier)

---

## Go-to-Market Strategy

### Phase 1: Stealth Launch (Week 1-2)
**Goal:** Validate core experience with beta testers

**Channels:**
- Direct outreach to 10 AI safety students (personal network)
- Post in Anthropic Discord, Alignment Forum
- Request feedback on Twitter (personal account)

**Messaging:**
"I built a platform to learn AI safety through DSA problems.
Each problem maps to implementing a real paper (RLHF, Constitutional AI, etc.).
Looking for 10 beta testers - DM me!"

---

### Phase 2: Public Launch (Month 1)
**Goal:** Get first 100 users

**Channels:**
- Twitter thread: "I learned AI safety by solving these 14 DSA problems..."
- Post on r/MachineLearning, r/MLQuestions
- Alignment Forum showcase
- AI Safety Slack/Discord communities

**Messaging:**
"Want to implement AI safety papers but don't know where to start?
I created Cortex Lattice - teaches the DSA patterns you need through
problems that map directly to papers like InstructGPT and Constitutional AI."

**Content:**
- Blog post: "From Two Pointers to Flash Attention"
- Video walkthrough of first problem
- Twitter thread showing problem → paper connection

---

### Phase 3: Growth (Month 2-3)
**Goal:** Get to 500 users

**Channels:**
- Weekly blog posts on specific patterns
- Guest post on Alignment Forum
- AI safety podcast appearances
- Partnerships with AI safety courses/bootcamps

**Messaging:**
"The fastest way to learn AI alignment is through code.
Cortex Lattice teaches you the algorithms behind every major
AI safety paper through hands-on problems."

**Content:**
- Case study: "I implemented RLHF after solving 3 problems"
- Tutorial series: "AI Safety Algorithms Explained"
- Pattern library: Reference guide for all 28 problems

---

## Competitive Landscape

### vs LeetCode
**Them:**
- Generic DSA problems
- No domain context
- Disconnected from real work

**Us:**
- AI safety themed
- Every problem maps to a paper
- Direct connection to implementations

**Our advantage:** Specificity and relevance for AI safety learners

---

### vs Grokking the Coding Interview
**Them:**
- Teaches patterns well
- Static content
- No execution environment

**Us:**
- Also teaches patterns
- Interactive coding + hints
- Mobile-optimized

**Our advantage:** Better UX and execution environment

---

### vs Coursera/Fast.ai
**Them:**
- Video lectures
- High-level theory
- Slow paced

**Us:**
- Hands-on coding
- Algorithmic foundations
- Self-paced

**Our advantage:** Active learning through problem solving

---

### vs AI Safety Camp / MATS
**Them:**
- In-person programs
- Limited spots
- High commitment

**Us:**
- Online, accessible
- Learn at your own pace
- Free tier + paid options

**Our advantage:** Accessibility and scalability

---

## Pricing Strategy (Post-MVP)

### Free Tier
- Access to 10 problems (2 from each theme)
- All hint categories available
- Limited to 10 submissions per day
- No progress tracking

### Individual ($20/month or $200/year)
- Full access to all problems
- Unlimited submissions
- Progress tracking & pattern collection
- Certificate of completion
- Priority support

### Enterprise (Custom pricing)
- For companies training engineers
- Admin dashboard
- Custom problem creation
- Analytics & reporting
- Dedicated support

**MVP Launch:** Everything free to validate product-market fit

---

## Technical Risks & Mitigations

### Risk 1: Docker Execution Too Slow
**Impact:** Poor user experience if tests take >10 seconds  
**Mitigation:**
- Optimize Docker image (minimize layers)
- Pre-warm containers
- Add caching for common imports (PyTorch)
- Use smaller Python base image

---

### Risk 2: Mobile Code Editor UX Poor
**Impact:** Users abandon on mobile  
**Mitigation:**
- Extensive mobile testing in Week 1
- Alternative: iPad-only requirement (larger screen)
- Fallback: Desktop-first, mobile for reading problems only

---

### Risk 3: Hints Too Easy/Hard
**Impact:** Users either get spoiled or stay stuck  
**Mitigation:**
- A/B test hint verbosity
- Track: hints used vs solve time
- Iterate based on user feedback
- Add difficulty slider per user

---

### Risk 4: PyTorch Install Too Heavy
**Impact:** Slow Docker builds, large images  
**Mitigation:**
- Use CPU-only PyTorch (smaller)
- Cache built images aggressively
- Consider pre-built base image on Docker Hub

---

## Open Questions

### Content Strategy
- [ ] Should all 5 Week 1 problems be Mini-GPT + PPO? Or mix in RLHF?
- [ ] How much code should "Project Context" hints show?
- [ ] Should we link to your GitHub repos for full implementations?

### UX Decisions
- [ ] Should hints auto-save progress (persist which hints user saw)?
- [ ] Allow downloading solutions after solving?
- [ ] Show leaderboard (time to solve) for competitive users?

### Business Model
- [ ] Launch with paid tier immediately or wait 3 months?
- [ ] What price point: $15/mo, $20/mo, $30/mo?
- [ ] Offer lifetime deal for early supporters?

---

## Success Definition

**Week 1 MVP is successful if:**
1. 5 beta testers complete at least 1 problem each
2. 3+ testers successfully implement part of a paper using learned pattern
3. Mobile UX rated 4+/5 by users
4. Technical execution works reliably (<5 sec results)

**Month 1 launch is successful if:**
1. 50+ registered users
2. 70%+ solve rate on attempted problems
3. Users explicitly mention "Project Context" as valuable
4. At least 5 users post "I implemented X paper" updates

**Month 3 is successful if:**
1. 500+ users
2. 50+ users solve 10+ problems (engaged learners)
3. 5+ paid subscribers (validates business model)
4. Clear evidence of pattern transfer (users recognize patterns across papers)

---

## Next Steps (Immediate)

### Week 1 Development Plan

**Day 1-2: Setup & Infrastructure**
- [ ] Initialize Next.js project
- [ ] Set up Docker executor
- [ ] Create basic file structure
- [ ] Test code execution pipeline

**Day 3-4: Frontend**
- [ ] Build problem browser
- [ ] Implement code editor (CodeMirror)
- [ ] Create bottom sheet component
- [ ] Build hint system UI

**Day 5-6: Content Creation**
- [ ] Create first 3 problems (Mini-GPT focused)
- [ ] Write all guidance.yaml files
- [ ] Test hint flow on mobile

**Day 7: Polish & Testing**
- [ ] Mobile responsiveness testing
- [ ] Bug fixes
- [ ] Beta tester recruitment
- [ ] Launch to 5 beta testers

---

**This PRD defines the complete MVP product specification for Cortex Lattice, ready for development.**
