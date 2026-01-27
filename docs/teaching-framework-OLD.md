# The Teaching Framework: How Cortex Lattice Actually Teaches

## Where This Fits in the Platform

This framework is **Layer 2** of the platform architecture:

**Layer 1: The Vision**
- Cross-domain pattern education
- Multiple themes (Software, EE, Physics, Aerospace)
- Gamification and progression
- Worker-owned business model

**Layer 2: The Teaching System ⭐ THIS FRAMEWORK**
- How each individual challenge actually teaches
- The infrastructure that makes passive problems into active learning
- What differentiates us from LeetCode/Grokking/Coursera

**Layer 3: Platform Features**
- Collaborative mode
- Social features
- Pattern collection mechanics
- Progress tracking

**Layer 4: Technical Implementation**
- Code execution engine
- Visualization renderer
- Trace analyzer
- UI/UX

## Why This Framework Is Critical

### Without This Framework
- You have LeetCode clone with space theme
- User submits code → "Wrong Answer" → no guidance
- No better than existing platforms

### With This Framework
- User submits code → System detects EXACTLY what they misunderstood
- Shows side-by-side: "Here's what you did vs. what you should do"
- Pause points teach active thinking
- User learns the PATTERN, not just one solution

**This is our moat. This is what makes Cortex Lattice 10x better.**

## The Four-File System Per Problem

Each problem consists of four meticulously crafted files:

### File 1: problem.yaml (30 minutes to create)

**What it contains:**
- Problem statement
- Input/output examples
- Test cases
- Constraints
- Starter code template

**Why it matters:**
This is table stakes. Everyone has this (LeetCode, HackerRank, etc.). We need it, but it's not our differentiator.

**Example structure:**
```yaml
id: two-pointers-asteroid-belt
title: "Asteroid Belt Navigation"
difficulty: easy
pattern: two-pointers

description: |
  You're piloting through an asteroid belt...

examples:
  - input: {...}
    output: {...}
    
test_cases: [...]
constraints: [...]
starter_code: |
  def find_asteroid_pair(positions, target_distance):
      pass
```

### File 2: invariants.yaml (1 hour to create)

**What it contains:**
Definition of what MUST be true for the algorithm to work correctly.

**Why this is our innovation:**
- These are the "rules of the game" for this pattern
- When user's code violates an invariant → we know EXACTLY what they misunderstood
- Teaches them to think in terms of invariants (how experts think)

**Example for Two Pointers:**
```yaml
invariants:
  - id: "pointer-bounds"
    description: "Left pointer must be less than right pointer"
    rationale: "Prevents checking same pair twice"
    
  - id: "sorted-assumption"
    description: "Array must be sorted"
    rationale: "Two pointers only works on sorted data"
    
  - id: "move-based-on-comparison"
    description: "Move pointer based on comparison with target"
    rationale: |
      If current distance < target, need larger distance (move left up)
      If current distance > target, need smaller distance (move right down)
```

**How we use this:**
When analyzing user's code execution trace, we check if these invariants hold. If not, we provide a targeted teaching moment explaining which invariant was violated and why it matters.

### File 3: mistakes.yaml (1.5 hours to create)

**What it contains:**
Catalog of common mistakes, how to detect them, and what to teach when detected.

**Why this is our killer feature:**
- Instead of generic "Wrong Answer", we tell them EXACTLY what pattern they missed
- Shows them not just what's wrong, but WHY it's wrong
- Visualizes the mistake vs. correct approach
- Pedagogically sophisticated in a way coding platforms aren't

**Example:**
```yaml
mistakes:
  - id: "brute-force-nested-loops"
    pattern: "Two nested loops checking all pairs"
    
    detection:
      logic: |
        Check execution trace for:
        - Outer loop iterating over indices
        - Inner loop iterating from outer+1 to end
        - O(n²) time complexity
    
    teaching_moment:
      title: "You're using brute force (O(n²)), but Two Pointers solves this in O(n)"
      
      explanation: |
        Brute force checks every pair, but with sorted data we can be smarter.
        Two pointers starts wide and narrows based on comparison.
      
      visualization:
        type: "side-by-side-comparison"
        your_approach:
          show: "Nested loops checking all pairs (highlighted in red)"
          complexity: "O(n²) - 45 comparisons for n=10"
        
        optimal_approach:
          show: "Two pointers moving inward (highlighted in green)"
          complexity: "O(n) - 9 comparisons for n=10"
      
      hint: "Start pointers at opposite ends, move based on comparison"
      
  - id: "moving-wrong-pointer"
    pattern: "Moving pointer in wrong direction"
    
    detection:
      logic: |
        At each step:
        - Calculate current distance
        - Check which direction moves
        - If distance < target AND moved right down → FLAG
        - If distance > target AND moved left up → FLAG
    
    teaching_moment:
      title: "You moved the wrong pointer"
      
      explanation: |
        Current distance is LESS than target, so you need a LARGER distance.
        Moving right pointer DOWN makes distance SMALLER.
        You should move left pointer UP to increase distance.
      
      visualization:
        type: "step-by-step-comparison"
        show_your_move: "Right pointer moved from 8→7 (distance got smaller)"
        show_correct_move: "Left pointer should move 0→1 (distance gets larger)"
      
      hint: "Think about how each pointer movement affects the distance"
```

**The power of this:**
When a user makes this exact mistake, we don't just say "wrong" - we show them:
1. What they did (moved right pointer)
2. Why it's wrong (distance got smaller when you need larger)
3. What they should do (move left pointer)
4. The principle (always move the pointer that increases distance toward target)

### File 4: pause-points.yaml (45 minutes to create)

**What it contains:**
Interactive moments where execution pauses and asks user to predict next step.

**Why this transforms learning:**
- Turns passive watching into active thinking
- Forces pattern recognition in real-time
- Creates "generation effect" for better retention
- Makes users THINK like the algorithm, not just memorize it

**Example:**
```yaml
pause_points:
  - id: "first-decision"
    trigger: 
      step: 1
      condition: "Pointers just initialized"
    
    context:
      show_state: |
        positions = [100, 250, 350, 500, 750]
        left = 0 (value: 100)
        right = 4 (value: 750)
        target_distance = 250
        current_distance = 750 - 100 = 650
    
    question: "Current distance (650) is too large. Which pointer should move?"
    
    options:
      - text: "Move left pointer right (→)"
        correct: false
        feedback: |
          Moving left right makes distance SMALLER (correct direction!)
          But we need to decrease by a lot. Let's think about it differently:
          Which pointer position is the "bottleneck"?
          
      - text: "Move right pointer left (←)"
        correct: true
        feedback: |
          ✓ Correct! Current distance is too large, so we move right pointer
          left to make the gap smaller. This is the Two Pointers pattern:
          adjust pointers based on comparison with target.
    
    teaching_moment: |
      Key insight: When distance is too large, move right pointer left.
      When distance is too small, move left pointer right.
      This is the core of the Two Pointers pattern.
      
  - id: "recognize-pattern"
    trigger:
      step: 3
      condition: "User has made 2 moves"
    
    question: "You've moved twice now. Do you see the pattern?"
    
    reflection_prompt: |
      Think about:
      1. How did you decide which pointer to move each time?
      2. What's the relationship between current distance and target?
      3. Can you describe the rule in one sentence?
    
    reveal_answer: |
      The pattern: Compare current distance to target.
      - Too large? Move right pointer left (decrease distance)
      - Too small? Move left pointer right (increase distance)
      - Just right? Found it!
      
      This is Two Pointers in action - using sorted property to eliminate
      unnecessary comparisons.
```

**The pedagogical power:**
Research shows that actively predicting outcomes (even if wrong) leads to better learning than passively receiving information. These pause points create "desirable difficulty" that strengthens pattern retention.

## How These Files Work Together

### User Journey Through One Problem

1. **User reads problem** (problem.yaml)
   - "Find two asteroids exactly target distance apart"

2. **User writes code**
   - First attempt: Brute force with nested loops

3. **User submits**

4. **System executes code and generates trace**
   - Records every step of execution
   - `[left=0, right=9], [left=1, right=9], [left=1, right=8]...`

5. **System checks trace against invariants** (invariants.yaml)
   - Detects: "Time complexity is O(n²), should be O(n)"
   - Matches to mistake pattern in mistakes.yaml

6. **System shows teaching moment**
   - "You're checking every pair (O(n²))"
   - "Two pointers can solve this in O(n)"
   - Visualization: Shows brute force (red) vs two pointers (green)
   - Hint: "Start at widest position, move based on comparison"

7. **User revises code** (now using two pointers)

8. **User steps through visualization**

9. **At pause point** (pause-points.yaml)
   - System pauses: "Left=0 (height=100), Right=4 (height=750). Which moves?"
   - User predicts: "Move right left to decrease distance"
   - System: "✓ Correct! Current distance too large, need smaller"
   - Teaching moment: "This is the Two Pointers pattern - adjust based on comparison"

10. **User completes problem**
    - Pattern learned: Two Pointers + comparison-based movement
    - Added to collection: User now "owns" this pattern
    - Can apply to next problem: Recognizes pattern in new context

## Why This Is Better Than Existing Platforms

### vs. LeetCode/HackerRank

**Them:**
- ❌ Submit code → "Wrong Answer"
- ❌ No guidance on WHAT went wrong
- ❌ User searches online for solution
- ❌ Copies solution without understanding
- ❌ Doesn't learn pattern

**Us:**
- ✅ Submit code → "You violated move-based-on-comparison invariant"
- ✅ Shows exactly what they misunderstood
- ✅ Visualizes their approach vs. correct approach
- ✅ Teaches the pattern through interaction
- ✅ User learns to recognize pattern in future problems

### vs. Grokking the Coding Interview

**Them:**
- ✅ Teaches patterns (better than LeetCode)
- ❌ Static text explanations
- ❌ No mistake detection
- ❌ No interactive learning
- ❌ Just reading, not doing

**Us:**
- ✅ Teaches patterns
- ✅ Interactive execution playback
- ✅ Detects specific mistakes
- ✅ Pause points for active learning
- ✅ Learning by doing with intelligent guidance

## Content Creation Economics

### Time Investment Per Problem

**First problem in a pattern:** ~4 hours
- 30 min: Problem definition
- 1 hour: Invariants (requires deep thinking about what makes pattern work)
- 1.5 hours: Mistake catalog (anticipate common errors)
- 45 min: Pause points (identify key teaching moments)
- Plus: Pattern definition document (one-time, 4-6 hours)

**Subsequent problems in same pattern:** ~3 hours
- Reuse pattern knowledge
- Just define problem-specific invariants/mistakes

**For one complete pattern (3-4 problems):**
- Pattern doc: 5 hours (once)
- Problem 1: 4 hours
- Problem 2: 3 hours
- Problem 3: 3 hours
- **Total: ~15 hours per pattern**

**For 16 patterns (Software Engineering theme):**
- 16 patterns × 15 hours = 240 hours
- That's 6 weeks of full-time work (40 hrs/week)
- Or 3 months at 20 hrs/week (realistic while learning)

### MVP Approach: Tiered Content

**Tier 1: Core Problem (1.5 hours)**
- Problem definition
- Basic invariants
- Top 2-3 mistakes
- No pause points
- Good enough for launch

**Tier 2: Teaching Problem (3-4 hours)**
- Everything in Tier 1
- All mistakes cataloged
- 2-3 pause points
- Full teaching moments
- High quality learning experience

**Tier 3: Showcase Problem (5-6 hours)**
- Everything in Tier 2
- Multiple visualizations
- Advanced variants
- Pattern transfer examples
- Marketing/demo quality

**MVP Launch Strategy:**
- 5 Tier 3 problems (showcases) = 25 hours
- 10 Tier 2 problems (solid teaching) = 35 hours
- 15 Tier 1 problems (coverage) = 22.5 hours
- **Total: ~82.5 hours = 2 months at 10hrs/week**

Then upgrade Tier 1 → Tier 2 based on which problems users struggle with most.

## The Authoring Tools We'll Build

To accelerate content creation:

### 1. Trace Analyzer (automatic mistake detection)
```python
# Detects common patterns automatically
trace_analyzer.detect_nested_loops(user_code)
trace_analyzer.check_boundary_conditions(user_code)
trace_analyzer.find_missing_base_cases(user_code)
```
**Impact:** Saves ~30% of mistake-cataloging time

### 2. Mistake Template Generator
```python
generate_mistake_template(
    mistake_type="wrong-pointer-move",
    pattern="two-pointers"
)
# Scaffolds mistakes.yaml with common patterns
```
**Impact:** Saves ~20% of initial setup

### 3. Pause Point Suggester
```python
suggest_pause_points(
    solution_code,
    key_decisions=["which pointer to move", "update max"]
)
# Analyzes solution, suggests good teaching moments
```
**Impact:** Saves ~40% of pause point creation

**Combined:** Could reduce per-problem time from 3-4 hours to 2-2.5 hours

## How This Extends to Other Themes

The framework is domain-agnostic:

### Software Engineering (building first)
- **Invariants:** Algorithm correctness conditions
- **Mistakes:** Wrong pattern choice, efficiency issues
- **Pause points:** "Which data structure here?"

### Electrical Engineering
- **Invariants:** KVL, KCL, power conservation
- **Mistakes:** Wrong sign on voltage, forgot ground reference
- **Pause points:** "Which equation applies here?"

### Physics
- **Invariants:** Conservation laws, boundary conditions
- **Mistakes:** Wrong coordinate system, missed force
- **Pause points:** "What's the net force at this moment?"

### Aerospace
- **Invariants:** Orbital energy, momentum conservation
- **Mistakes:** Wrong reference frame, missed thrust vector
- **Pause points:** "When should you burn?"

**We're building teaching infrastructure that works for ANY technical domain.**

## The Pedagogical Foundation

### Why This Works (Research-Backed)

**Active Recall:**
Pause points force learners to retrieve knowledge, strengthening memory.

**Generation Effect:**
Predicting next steps (even if wrong) improves retention over passive observation.

**Deliberate Practice:**
Immediate feedback on specific mistakes enables targeted improvement.

**Cognitive Apprenticeship:**
Making expert thinking visible (invariants) allows novices to adopt expert mental models.

**Desirable Difficulty:**
Pause points create productive struggle that deepens understanding.

## The Bottom Line

This framework is HOW Cortex Lattice actually teaches.

**Without it:** LeetCode clone with space theme.

**With it:** Intelligent tutoring system that understands patterns, detects misconceptions, and guides learning.

This is our competitive advantage.

This is what justifies $997/year subscriptions.

This is what makes companies pay $1,497/user/year for training.

**Because we're not just giving them problems - we're giving them a system that makes people better engineers through intelligent, pattern-based teaching.**

---

*Next: Build the first problem end-to-end to validate this framework.*
