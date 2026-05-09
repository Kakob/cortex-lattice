# Progressive Hint Ladder — PRD

**Product:** Cortex Lattice
**Feature:** Progressive Hint Ladder
**Author:** Jacob
**Status:** Draft v0.1
**Last updated:** April 2026

---

## 1. Summary

The Progressive Hint Ladder is Cortex Lattice's core pedagogical engine. When a user gets stuck on a problem, the system serves them the smallest possible nudge that moves them forward — not the solution, not a generic tip, but the specific intervention that matches where they actually are in their reasoning. Hints are authored in tiers (Socratic nudge → concept pointer → approach sketch → pseudocode → partial code), matched to the user's current code state, and drawn from both curated and community-contributed sources.

The ladder is what makes Cortex Lattice adaptive. It's also what generates the platform's longer-term moat: a structured dataset of `{problem, stuck-state, hint, outcome}` tuples that functions as a reasoning-trace evaluation corpus — useful for improving the product today and extensible into an external evaluation platform over time.

---

## 2. Problem

Existing DSA practice platforms (LeetCode, NeetCode, AlgoExpert) optimize for throughput: solve the problem, see the solution, move on. Hints, where they exist, are generic and detached from the user's actual code state. The dominant learning mode is pattern memorization — grind enough problems, recognize the template, regurgitate it in interviews.

This produces fragile skill. Users pass interviews at pattern-matching companies but struggle when faced with problems that require reasoning from first principles. The frontier labs — the exact companies Cortex Lattice's target users want to work at — explicitly probe for reasoning, not pattern recognition. There is no practice platform built around developing that skill.

The deeper problem is that teaching reasoning is hard. Good pedagogy requires meeting the learner where they are and giving them the minimal intervention that unblocks them without collapsing the struggle that produces learning. This is expensive when done by humans (tutoring) and poorly done by current software (static hints, generic AI explanations). An adaptive system that gets this right is both a better product and a defensible one.

---

## 3. Goals and non-goals

### Goals

- Unblock genuinely stuck users with minimal reveal, preserving productive struggle.
- Classify user code state accurately enough that hints feel targeted rather than generic.
- Build a structured dataset of reasoning traces and hint effectiveness that compounds in value over time.
- Enable community contribution of hints in a way that increases quality and diversity without degrading pedagogy.
- Ship a pre-launch version that works at N=0 community contributions.

### Non-goals

- Replacing tutors or courses. The ladder assumes the user has foundational knowledge of data structures and algorithms; it is a practice tool, not an instructional one.
- Eliminating struggle. The ladder is stingy by design. Users who want direct solutions should use LeetCode.
- Serving as a code review or debugging assistant outside the hint context.
- Supporting non-DSA problem types at launch (system design, front-end challenges, etc.).

---

## 4. Users and use cases

### Primary personas

**The frontier-lab candidate.** Self-directed, technically strong, preparing for interviews at companies that test reasoning rather than pattern recall. Has done LeetCode, found it hollow, wants something that builds intuition. Values the pedagogy over the gamification.

**The returning learner.** CS student or career-switcher who knows fundamentals but struggles to apply them under pressure. Gets stuck frequently, needs help, but is embarrassed by how generic existing hint systems feel. Values targeted unblocking that respects their intelligence.

**The serious interviewee.** Actively interviewing, treats practice as skill-building. Willing to invest time per problem rather than racing through sets. Values hint quality and the ability to revisit problems without contamination from prior hint use.

### Core use cases

1. User runs code, tests fail, requests or is offered a hint appropriate to the failure.
2. User presses "Stuck" button before running code, receives a hint calibrated to where they are in writing it.
3. User solves a problem and is invited to contribute their own unblocking insight.
4. User returns to a previously-hinted problem and is served a variant rather than the same problem, with hint history preserved.
5. User's hint-use patterns across problems inform spaced-repetition scheduling and adaptive difficulty.

---

## 5. Functional requirements

### 5.1 Hint triggers

The ladder is invoked by exactly two user actions at launch:

- **Test failure after code execution.** When a user runs code and one or more tests fail, the system offers help. Before surfacing a hint or peer reflection, it prompts with a lightweight reflection query — "What feels wrong?" — to gather text signal. This is optional; the user can skip it and go straight to a hint. But when provided, the reflection text dramatically improves match quality for peer reflections (see Section 5.9).
- **"Stuck" button press with reflection.** Always visible in the editor. Pressing it opens a short text input: "Describe where you're stuck." The reflection text, combined with the current code state, drives both hint selection and peer reflection matching. The text input is encouraged but not required; pressing "Stuck" with no text falls back to code-state-only matching.

No proactive interruption based on inactivity, deletion ratio, tab switches, or other surveillance-style signals. The user initiates.

### 5.2 Hint tiers

Five tiers, ordered from minimal to maximal reveal:

- **Tier 1 — Socratic nudge.** A question that redirects attention without naming the technique. "What's the relationship between the input size and your current approach's runtime?"
- **Tier 2 — Concept pointer.** Names the relevant technique or data structure. "This is a sliding window problem."
- **Tier 3 — Approach sketch.** Two to three sentences describing the high-level strategy.
- **Tier 4 — Pseudocode outline.** Structural skeleton of the solution without implementation details.
- **Tier 5 — Partial code.** The key insight rendered as code, with the surrounding implementation left to the user.

Users escalate tiers explicitly. Each escalation is a metacognitive moment; the UI surfaces the tier name and a brief description of what kind of help it provides, so users can choose the minimum they need.

#### Intervention hierarchy

The five tiers above constitute the AI hint layer. Peer reflections (Section 5.9) sit in a distinct layer between self-prompting and AI hints, forming a broader intervention hierarchy:

1. **Self-prompt.** On hint request, the system first prompts the user to articulate their stuck state (see Section 5.1). This metacognitive step is itself an intervention — many users unblock themselves just by writing down what's wrong.
2. **Peer reflection.** If the user remains stuck after self-prompting, the system offers a matched peer reflection: another user's account of being stuck in a similar way and what made it click. This is human metacognition, not technical guidance.
3. **AI hints (Tiers 1–5).** The progressive hint ladder described above. Technical guidance from minimal to maximal reveal.
4. **Solution.** Full solution access, available only after engaging with the ladder.

Users can skip layers. The hierarchy is a recommended path, not a gate. But the default flow encourages self-prompting and peer wisdom before AI-generated help.

### 5.3 Code state classification

On hint request, the system classifies the user's current code state into one of five stages:

- **Stage 0 — Empty or scaffolding.** Function signature and placeholder return only.
- **Stage 1 — Attempting, wrong approach.** Substantive code that pursues a fundamentally wrong strategy.
- **Stage 2 — Right approach, incomplete.** Correct algorithmic shape, missing logic.
- **Stage 3 — Right approach, buggy.** Complete-looking solution with a specific bug.
- **Stage 4 — Correct but suboptimal.** Passes correctness, fails performance requirements.

Classification pipeline is cheap-first, expensive-as-needed:

- Heuristics handle obvious cases: character count for Stage 0, test results showing timeout for Stage 4, test results showing pass-on-examples-fail-on-hidden for Stage 3.
- LLM classifier handles ambiguous cases, especially Stage 1 vs Stage 2. Inputs include the problem statement, authored intended approach, key insight, the user's code, and test results. Output is a stage label plus a one-sentence description of the most important next step.

The stage determines the recommended starting tier. Users can always override.

### 5.4 Hint selection

Given a stage classification and a problem, the system selects a hint from three sources, in priority order:

1. **Authored hints** in the problem's YAML schema. Always available for Tiers 1 and 2. Curated by Jacob pre-launch, editable post-launch.
2. **Community hints** contributed by users who have solved the problem, matched to the current user's stuck-state via embedding similarity (see Section 5.7).
3. **LLM-generated hints** for Tiers 3–5, generated on demand from the problem spec, intended approach, and user code. Bounded in cost; cached when possible.

Authored hints take precedence for Tier 1 and Tier 2 until community hints have accumulated sufficient positive usage signal to be surfaced.

### 5.5 Differentiated handling of the two triggers

The two triggers carry different signals and are handled accordingly:

- **Ran code and failed** biases toward Stage 3 (bug). Hints can reference specific failing test cases: "Trace your code with input `[1,1,2]`. What does line 7 return?"
- **Pressed "Stuck"** with minimal code biases toward Stage 0 or Stage 1. Hints stay conceptual and avoid referencing tests the user hasn't run.
- **Pressed "Stuck"** with substantial code biases toward Stage 2 or Stage 3. Hints address the specific incomplete or buggy region.

The "Stuck" button's hint content is a function of what's in the editor when it's pressed. Same button, different contexts, different responses.

#### Signal strength and peer reflection confidence

The two triggers also differ in signal strength for peer reflection matching:

- **Test failure alone is a weak signal.** Many users fail the same test for different reasons. When a user accepts help after test failure without providing reflection text, the system surfaces peer reflections more cautiously — requiring a higher similarity threshold — or falls back directly to AI hints.
- **Stuck reflection with text is a strong signal.** An explicit description like "I can't figure out why my recursion isn't terminating" combined with code showing a missing base case guard and specific failing tests produces a rich, matchable query. The system can surface peer reflections with higher confidence.

This two-tier signal model means the "what feels wrong?" prompt after test failure isn't just UX polish — it's the mechanism that upgrades a weak match signal into a strong one.

### 5.6 Community hint contribution

After a user solves a problem, the system prompts them once with an optional contribution flow:

- **Breakthrough reflection.** "What was the key insight that unlocked this for you?" (1–3 sentences, optional.) This is the breakthrough side of a reflection pair — what clicked, and why.
- **Hint contribution.** "If someone was stuck where you were stuck, what would you tell them without giving away the answer?" (Tier-1 or Tier-2 hint, optional.)
- **Timeline scrubber** showing the user's own code snapshots from the session; they can mark the point where they got unstuck. This pairs the contributed hint with a specific stuck-state snapshot.
- **Stuck reflection pairing.** If the user submitted a stuck reflection earlier in the session, the system automatically pairs it with the breakthrough reflection, creating a complete `(stuck → breakthrough)` reflection pair for the peer reflection corpus (see Section 5.9). The user can review and edit the pairing before submission.

Contributions are subject to:

- **Structural constraints** at authoring time. Character limits, tier-appropriate format (questions required for Tier 1, no code for Tiers 1–2, etc.).
- **Automated pre-filtering.** LLM check for solution-reveal, tier-mismatch, and off-topic content. Rejections return to the user with actionable feedback.
- **Usage-based ranking.** Post-serve solve rate within N minutes is the primary quality signal. Explicit thumbs-up/down is secondary.
- **Contributor reputation** over time. New contributors' hints require more usage data before broad surfacing.

Seed hints (authored by Jacob + synthetic) are clearly labeled in the schema and gradually deprioritized as organic community hints accumulate.

### 5.7 Stuck-state matching

Each hint contribution is paired with a stuck-state representation. At hint request time, the system retrieves the contributed hint whose stuck-state is most similar to the user's current state.

Stuck-state representation combines:

- **LLM-generated state description.** One to two sentences describing the user's apparent stage, misconception, and blocker. Normalizes across surface-level code variation.
- **Structural features.** AST-level signals: loop presence, recursion, hashmap/set usage, base case presence, memoization structure.
- **Test failure signature.** Which tests pass, which fail, failure mode (timeout, wrong output, exception).

These features are combined into an embedding. Retrieval is nearest-neighbor within the problem's hint pool. At low data volumes, structural features and test failure signatures are weighted more heavily than the embedding similarity, because pure embedding retrieval overfits to surface features when the contributor pool is small.

### 5.8 Reasoning-trace logging

Every hint interaction logs a structured record:

```
{
  session_id, user_id, problem_id, timestamp,
  trigger: "test_fail" | "stuck_button",
  reflection_text: <user's stuck reflection, if provided>,
  code_snapshot: <full editor state>,
  test_results: <pass/fail per test>,
  classified_stage: "0" | "1" | "2" | "3" | "4",
  hint_source: "authored" | "community" | "generated",
  hint_id, hint_tier, hint_content,
  peer_reflection_served: { pair_id, similarity_score } | null,
  self_prompt_sufficient: <bool>,
  outcome_5min: "solved" | "another_hint" | "abandoned" | "still_working",
  outcome_session: "solved" | "abandoned",
  user_feedback: "up" | "down" | null
}
```

These records serve three purposes at launch: improving the stage classifier, ranking community hints, and informing adaptive difficulty and spaced repetition. Longer-term, they constitute the raw material for the evaluation-platform pivot discussed in Section 10.

### 5.9 Peer reflection matching

#### The mechanic

When a user submits a stuck reflection or fails tests and provides reflection text, the system searches for a matched peer reflection: a past user's account of being stuck in a similar way on the same problem, paired with what eventually made it click. The surfaced content is the breakthrough side of the pair — "here's what someone who was stuck like you said when they got unstuck."

This is qualitatively different from the AI hint tiers. AI hints provide technical guidance (a nudge, a concept, pseudocode). Peer reflections provide human metacognition — another person's lived experience of the same confusion. AI genuinely cannot replicate this, and it occupies a distinct position in the intervention hierarchy (Section 5.2).

#### Retrieval target

The retrieval corpus is not hints but reflection pairs: `(stuck reflection → breakthrough reflection)`. Each pair captures a single user's arc from confusion to clarity on a specific problem.

- The **stuck reflection** is the text written at the moment of being stuck, embedded alongside the code state and test failure signature at that moment.
- The **breakthrough reflection** is the text written after solving, capturing what clicked and why.

At retrieval time, the current user's stuck state (reflection text + code + test results) is embedded and matched against the stuck side of stored pairs. The breakthrough side of the best-matching pair is what gets surfaced.

This means the system is answering: "someone who was stuck *like you* eventually realized *this*." That is a fundamentally different — and often more useful — intervention than "here is a hint about the technique."

#### Delay and earn pattern

Peer reflections are not surfaced immediately on stuck submission. The flow:

1. User submits stuck reflection (or provides "what feels wrong?" text after test failure).
2. System responds with a lightweight self-prompt: a question derived from their reflection that nudges them to examine their own assumptions. ("You said your recursion isn't terminating — what's supposed to stop it?")
3. If the user requests further help, the matched peer reflection is revealed.

This two-step flow serves two purposes: it gives the user a chance to unblock themselves (the self-prompt alone is often sufficient), and it makes the peer reflection feel earned rather than spoon-fed. The peer reflection lands harder when the user has already tried to think through the self-prompt and still needs help.

#### Corpus quality gating

A bad peer reflection match is worse than no match — it erodes trust in the feature. Quality controls:

- **Minimum corpus size per problem.** Peer reflections are not surfaced for a problem until it has at least N validated reflection pairs (tentatively N=5). Below this threshold, the system falls back to AI hints with no indication that a peer reflection feature exists for that problem.
- **Minimum similarity threshold.** Even with a sufficient corpus, a match is only surfaced if it exceeds a similarity floor. Low-confidence matches fall back to AI hints.
- **Graceful fallback.** When peer reflections are unavailable or below threshold, the intervention hierarchy skips the peer reflection layer entirely. The user moves from self-prompt directly to AI hints. No empty states, no "no peer reflections available" messages.
- **"Problems with peer wisdom available"** serves as a soft growth metric — a concrete measure of platform maturity that tracks how much of the problem set has reached the corpus threshold.

---

## 6. Technical architecture

### 6.1 Problem schema additions

Each problem's YAML gains the following fields:

```yaml
intended_approach: <string>        # used by classifier and hint generator
key_insight: <string>              # used by classifier and hint generator
authored_hints:
  - tier: 1
    content: <string>
  - tier: 2
    content: <string>
  # Tiers 3-5 optional; generated on demand if absent
community_hints:
  - id: <string>
    contributor_id: <string>
    tier: <int>
    content: <string>
    stuck_state_description: <string>
    stuck_state_embedding: <vector>
    structural_features: <object>
    test_failure_signature: <object>
    served_count: <int>
    post_serve_solve_rate: <float>
    thumbs_up: <int>
    thumbs_down: <int>
    status: "active" | "shadowbanned" | "promoted"
    source: "organic" | "synthetic" | "jacob_seed"
reflection_pairs:
  - id: <string>
    problem_id: <string>
    contributor_id: <string>
    stuck_reflection_text: <string>
    stuck_code_snapshot: <string>
    stuck_test_results: <object>
    stuck_embedding: <vector>
    breakthrough_reflection_text: <string>
    session_id: <string>
    served_count: <int>
    post_serve_solve_rate: <float>
    similarity_threshold_met_count: <int>
    status: "active" | "gated" | "retired"
```

### 6.2 Services

- **Classifier service.** Heuristics pipeline + LLM fallback. Input: problem spec, user code, test results. Output: stage label + one-sentence next-step description.
- **Hint selector.** Input: stage, problem, user code, user history. Output: selected hint (authored / community / generated).
- **Embedding service.** Produces stuck-state embeddings for contributed hints at authoring time and for user code at request time. Cache embeddings for authored and community hints.
- **Reflection matching service.** Input: stuck reflection text, code state, test results. Output: best-matching reflection pair (if above similarity threshold) and a generated self-prompt. Retrieves against the problem's reflection pair corpus using combined embedding of reflection text + structural features.
- **Trace logger.** Writes structured records to the reasoning-trace store. Append-only.
- **Contribution pipeline.** Authoring UI → structural validation → LLM pre-filter → reflection pair assembly → persistence → initial low-weight ranking.

### 6.3 Data store

Postgres for problem content, community hints, user progress, and trace logs. Embeddings in a vector index (pgvector at launch, migration path to a dedicated vector store if scale demands). Code snapshots compressed and stored alongside trace records.

### 6.4 Cost management

API calls are the dominant variable cost. Controls:

- Tier 1–2 hints are authored when possible; generation is for Tier 3–5 only.
- Classifier LLM is invoked only when heuristics are ambiguous.
- State descriptions are generated once per request and cached per session.
- Authored and community hint embeddings are computed at authoring time, not at request time.
- Per-user daily cost caps on LLM-backed hint generation, with graceful fallback to authored/community hints when exceeded.

---

## 7. Pre-launch data strategy

At N=0 community contributions, the ladder must still feel functional. Pre-launch dataset targets:

- **~50 problems** spanning core DSA categories (arrays, strings, hashmaps, trees, graphs, DP, recursion, two-pointer, sliding window).
- **Authored Tier 1 and Tier 2 hints** for every problem.
- **3–5 stuck-state / hint pairs per problem** in the community pool, labeled as seed data, generated by a combination of:
  - Jacob dogfooding the product and annotating his own stuck-states.
  - Synthetic generation via Claude, reviewed and edited by Jacob, covering common misconceptions and bugs.
  - Optional: pre-launch closed beta with a small group (WGU peers, ICE Lab contacts, Chicago CS community) producing organic stuck-states.

- **Seed reflection pairs** for high-priority problems, generated by:
  - Jacob dogfooding and capturing his own stuck → breakthrough arcs with written reflections.
  - Synthetic pairs generated via Claude from common misconceptions, reviewed and edited for authenticity. Labeled as synthetic.
  - Closed beta participants producing organic reflection pairs during their sessions.

Reflection pair seeding is harder than hint seeding — synthetic reflections risk feeling generic. Prioritize organic pairs from dogfooding and beta; use synthetic only to reach the minimum corpus threshold (N=5) for problems where organic data is sparse.

Seed data is flagged and gradually retired as organic community hints and reflection pairs accumulate and outrank it.

---

## 8. Success metrics

### Leading indicators (week 1–4 post-launch)

- Hint request rate per problem attempt.
- Distribution of hint tiers served (Tier 1 should dominate early).
- Stage classifier accuracy, measured via spot-check and user feedback.
- Community contribution rate among solvers.
- Pre-filter rejection rate for contributed hints.

### Lagging indicators (month 2+)

- Post-hint solve rate within 5 minutes, segmented by hint source.
- Retention of users who used at least one hint vs. those who did not.
- Ratio of organic to seed hints served.
- Problem completion rate, segmented by whether hints were used.

### Health signals to watch

- Hint request rate climbing too fast suggests pedagogy is failing (hints too easy to get, users leaning on them rather than struggling).
- Hint request rate at zero suggests hints are undiscoverable or feel punitive.
- Community hint thumbs-down spike suggests pre-filter is letting through bad content.
- Stage classifier disagreement with user-reported experience suggests the heuristic layer or LLM prompt needs revision.

---

## 9. Risks and open questions

### Risks

- **Hint quality degrades as community scales.** Mitigation: structural constraints, pre-filter, usage-based ranking, reputation system. Watch thumbs-down rate and served-hint solve rate.
- **Stage classifier is wrong often enough to erode trust.** Mitigation: let users override tier selection, collect disagreement signal, iterate on prompts and heuristics. Pre-launch testing on Jacob's own sessions.
- **API costs scale faster than revenue.** Mitigation: aggressive authoring of Tier 1–2 hints, caching, per-user caps. Revisit if free-tier usage drives costs beyond target.
- **Users game the contribution system for reputation.** Mitigation: behavioral signal (post-serve solve rate) is harder to game than explicit votes; reputation requires usage volume, not just submission volume.
- **Embedding retrieval overfits at low data.** Mitigation: weight structural features and test signatures heavily at low N, lean more on embeddings as the pool grows.
- **Thin reflection corpus produces bad matches early on.** A poorly matched peer reflection is worse than no peer reflection — it makes users distrust the feature. Mitigation: minimum corpus size per problem (N=5 validated pairs) before surfacing, minimum similarity threshold, graceful fallback to AI hints. The feature should be invisible on problems where it can't perform well.

### Open questions

- Should hint history persist across problem revisits, or reset? Current thinking: persist, and serve a problem variant instead of the original on revisit.
- How much should the tamagotchi companion's reactions gamify hint stinginess? Risk of feeling preachy if overdone. A cleaner reward signal: the companion grows when a user's contributed reflection gets matched to a stuck user and helps them break through. This ties companion growth to genuine contribution rather than abstinence from hints.
- Should community contributions be anonymous by default, pseudonymous, or tied to contributor profiles? Implications for reputation, gaming, and user comfort.
- At what point do seed hints get retired entirely vs. kept as a quality floor?
- How do we handle problems where the "right approach" has multiple legitimate variants? The schema currently assumes a single intended approach.

---

## 10. Longer-term direction

The Progressive Hint Ladder is the core of Cortex Lattice's consumer product, but the reasoning-trace dataset it generates is independently valuable. Each `{problem, stuck-state, hint, outcome}` tuple is a data point in a benchmark for evaluating pedagogical reasoning — the ability of a system (human or model) to identify where a learner is stuck and provide the minimal intervention that unblocks them.

This dataset does not exist elsewhere. LeetCode has problems and solutions but no stuck-states and no hint-effectiveness data. Educational platforms have student progress but not reasoning traces. The combination is specific to Cortex Lattice's architecture.

Potential future directions once the dataset reaches scale:

- **External evaluation API.** Allow model developers to test their systems' pedagogical capabilities against the Cortex Lattice benchmark.
- **Fine-tuning dataset** for models specialized in reasoning assistance rather than answer generation.
- **Research collaboration** with academic groups working on AI tutoring, reasoning evaluation, or human-AI collaboration in learning.

These are not launch goals. They are the reason the logging architecture in Section 5.8 is built right from day one.

---

## 11. Rollout

- **Phase 0 — Pre-launch (now).** Authored hints for ~50 problems. Synthetic seed hints generated and reviewed. Classifier and selector services built and tested against Jacob's own sessions. Logging in place.
- **Phase 1 — Closed beta.** 5–10 invited users from personal network. Goal: organic stuck-state and contribution data, early signal on classifier accuracy, UI friction identification. Two to four weeks.
- **Phase 2 — Public launch.** Portfolio-ready demo URL. Hint ladder visible on all problems. Contribution flow live. Reasoning-trace logging active. Monitor metrics in Section 8.
- **Phase 3 — Community scaling.** Reputation system activated. Seed hints begin retirement as organic pool grows. Adaptive difficulty and spaced repetition begin consuming trace data.
- **Phase 4 — Evaluation platform exploration.** Dataset reviewed for external-facing utility. Research outreach considered.
