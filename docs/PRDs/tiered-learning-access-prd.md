# PRD: Tiered Learning Access (Free / Pro / Cohort)

**Product:** Cortex Lattice
**Author:** Jacob
**Status:** Draft
**Last updated:** April 23, 2026

---

## 1. Summary

Cortex Lattice introduces a three-tier access architecture — **Free**, **Pro**, and **Cohort** — to support progressive monetization without gating core pedagogical value, and to build the platform for a future cohort-based learning model without prematurely shipping one.

Alpha ships **Free and Pro** only. The **Cohort** tier exists in the data model and product architecture from day one but is not surfaced in the UI until the founder has personally run at least one free pilot cohort.

---

## 2. Problem & Motivation

Cortex Lattice's differentiator is the pedagogical layer around each problem — themed statements, progressive hints, reflection schema, pattern-level progression, spaced repetition — not the problems themselves. A monetization model that paywalls the *problems* would commoditize the product against LeetCode and NeetCode; a model that paywalls the *pedagogy* preserves the differentiation.

Two problems this PRD solves:

1. **Monetization without crippling acquisition.** New users need enough of the product to feel its unique value before converting. A broken or gutted free tier produces a worse-than-LeetCode experience and kills word-of-mouth.
2. **Architectural readiness for the cohort model.** The long-term vision includes cohort-based learning with a mentor marketplace. Retrofitting cohort concepts (enrollment, mentor assignment, scheduled sessions) into a platform built around solo users is expensive. Building the data model now, even with the UI hidden, is a low-cost future-proofing move.

The cohort tier is explicitly a **roadmap decision**, not an alpha shipping commitment.

---

## 3. Goals & Non-Goals

### Goals (alpha)

- Ship Free and Pro tiers with Stripe billing.
- Validate willingness to pay for enhanced pedagogy at $19/mo.
- Instrument tier-level behavior to drive later decisions (conversion rate, retention by tier, paywall drop-off points).
- Architect the data model to support a future Cohort tier without refactor.
- Preserve the option to launch cohorts after the founder runs one free pilot.

### Non-goals (alpha)

- Cohort delivery, scheduling, or live sessions.
- Mentor marketplace, mentor onboarding, or revenue-share infrastructure.
- Certificates, credentials, or employer-verifiable outcomes.
- Team, enterprise, or university plans.
- Student discounts, income-based pricing, or regional pricing (defer to post-alpha).
- Annual pricing (defer until monthly conversion is validated).

---

## 4. Tier Definitions

| | **Free** | **Pro** | **Cohort** *(Waitlist — post-pilot)* |
|---|---|---|---|
| **Price** | $0 | $19/mo | TBD — likely $299–799 per cohort, 6 weeks |
| **Access to problems** | First pattern (~15 problems) forever + 7-day full trial | All patterns, all problems | All patterns + cohort-specific track |
| **Hints / learning guide** | Full on free content + during trial | Full on all content | Full + live human guidance |
| **Reflections / journaling** | ✅ | ✅ | ✅ + peer visibility |
| **Spaced repetition review** | ✅ on free content | ✅ all content | ✅ + cohort review sessions |
| **Themed problem statements** | ✅ | ✅ | ✅ |
| **Live sessions** | ❌ | ❌ | ✅ (weekly) |
| **Mentor/founder access** | ❌ | ❌ | ✅ (async Q&A + live) |
| **Cohort community** | ❌ | ❌ | ✅ (Discord/Slack) |
| **Conversion hypothesis** | User completes Two Pointers pattern, recognizes pedagogy value, converts on paywall into Sliding Window | User completes several patterns solo, hits ceiling on motivation or depth, joins cohort for accountability | N/A — endpoint |
| **Target user** | DSA-curious, LeetCode-fatigued, interview-prep beginner | Actively interviewing, willing to pay for better prep tools | Serious job-seeker wanting structure, accountability, and human support |

### Free tier rationale

Generous free tier chosen deliberately. "First pattern forever + 7-day full trial" lets a user:

1. Fully experience the pedagogy on a complete pattern (Two Pointers — 15 problems with full hints, reflections, themed statements, spaced repetition).
2. Sample the *breadth* of the product during trial to feel what they'd get on Pro.

The paywall triggers at a natural motivational moment: the user has just finished their first pattern, feels competent, and wants the next one. This is the opposite of a content-scarcity paywall — it's a momentum-preservation paywall.

### Pro tier rationale

$19/mo benchmarked against:

- LeetCode Premium: ~$35/mo
- NeetCode Pro: ~$15–20/mo
- AlgoExpert: ~$99/year (effectively $8/mo but annual-only)
- Grokking (Design Gurus): ~$89 one-time per course

$19/mo positions Cortex Lattice as slightly premium to NeetCode, materially cheaper than LeetCode Premium, with differentiated pedagogy as the justification.

### Cohort tier rationale (future)

Waitlist-only during alpha. Final pricing and structure TBD based on waitlist size, waitlist → paid intent signal, and founder's experience running the first free pilot cohort.

Working assumption: $299 for the first paid cohort (6 weeks, founder-led, 10 seats, post-pilot). Pricing will climb as the founder graduates into hiring mentors under a revenue-share model (60/40 favoring platform).

---

## 5. User Flows

### 5.1 New user — Free path

1. User lands on marketing site → clicks "Start free."
2. Email signup, no payment required.
3. Onboarding: brief diagnostic, user selects job track (SWE / Quant / AI Engineer → themed problem statements).
4. User begins Two Pointers pattern. 7-day full-access trial starts automatically.
5. During trial: user can access all patterns. After day 7: access restricts to Two Pointers only (first pattern forever).
6. User completes Two Pointers → sees completion screen → clicks "Start Sliding Window."
7. **Paywall.** Modal: "You've completed Two Pointers. Continue with Sliding Window on Pro — $19/mo. 7-day refund guarantee." CTA: Upgrade / Keep reviewing Two Pointers.

### 5.2 Conversion: Free → Pro

- Stripe checkout, monthly subscription.
- On success: tier flips to `pro`, all content unlocks, user resumes at paywall point.
- Welcome email with curriculum roadmap.

### 5.3 Pro user — ongoing

- Full access.
- In-product prompts for cohort waitlist appear contextually after ~3 patterns completed (once cohort waitlist is opened).

### 5.4 Cohort waitlist signup (when opened)

- Waitlist tile on pricing page: "Cohort — coming soon. Join waitlist for early access."
- Signup captures: email, target job (SWE/Quant/AI/other), target companies, timeline, willingness to pay band ($100–300 / $300–600 / $600+), preferred cohort cadence.
- Waitlist data feeds cohort pricing and scheduling decisions.

### 5.5 Paywall UX notes

The paywall is the single most important UX moment in this PRD. It must:

- Appear at a moment of earned momentum, not frustration.
- Clearly communicate *what Pro adds* beyond the free tier.
- Offer a refund guarantee to reduce purchase friction.
- Not block review of previously-accessed free content (never punish the free user).

---

## 6. Data Model

### Tables introduced

**`users`** *(existing, extended)*

- `tier`: enum (`free`, `pro`, `cohort_active`, `cohort_alumni`)
- `trial_started_at`, `trial_expires_at`
- `stripe_customer_id`

**`subscriptions`** *(new)*

- `user_id`, `status`, `plan` (`pro_monthly`), `current_period_end`, `stripe_subscription_id`

**`cohort_waitlist`** *(new — collected from day one)*

- `email`, `target_job`, `target_companies`, `timeline`, `price_band`, `cadence_preference`, `signed_up_at`, `source`

**`cohorts`** *(new — stubbed, not user-facing)*

- `name`, `start_date`, `end_date`, `seat_count`, `price_cents`, `status` (`planning`, `open`, `in_progress`, `completed`)

**`cohort_enrollments`** *(new — stubbed)*

- `user_id`, `cohort_id`, `enrolled_at`, `status`, `payment_status`

**`mentors`** *(new — stubbed, documented but not implemented)*

- Schema defined in PRD appendix. Not created in DB until mentor marketplace ships.

### Why stub cohort tables now

Defining `cohorts` and `cohort_enrollments` schemas during alpha (even if empty) means:

- Access control logic (`user.tier in ['pro', 'cohort_active']`) is written once, not retrofitted.
- UI components that reference cohort state can be built incrementally.
- Migration from solo-user to cohort-user data model doesn't require a schema rewrite.

---

## 7. Instrumentation

The whole point of three-tier architecture is to learn from behavior. Events tracked:

### Acquisition & conversion

- `signup_completed` (source, tier = free)
- `trial_started`, `trial_expired_without_conversion`
- `paywall_viewed` (context: which pattern, which problem)
- `upgrade_clicked`, `upgrade_completed`
- `free_to_pro_conversion_rate` (computed weekly)

### Engagement by tier

- `problem_started`, `problem_completed`, `hint_used`, `reflection_submitted` — all tagged with user tier.
- Retention: D1, D7, D30, D90 by signup tier.
- Pattern completion rate by tier.

### Cohort waitlist signal (once opened)

- `cohort_waitlist_signup` (target job, price band)
- `cohort_waitlist_to_pro_conversion` (how many waitlist members eventually buy Pro first)

### Key metrics to watch

- Free → Pro conversion rate. Target: 3–5% of weekly signups.
- Pro monthly retention. Target: >80% month-over-month.
- Paywall drop-off rate by pattern. (If users bounce at pattern 2's paywall more than pattern 3's, the value ladder is wrong.)

---

## 8. Pricing Rationale

Already covered in §4. Summary:

- **Free** is generous to maximize top of funnel and protect word-of-mouth.
- **Pro at $19/mo** slots between NeetCode and LeetCode Premium, justified by pedagogical depth.
- **Cohort pricing** is intentionally TBD — the waitlist data (plus founder's pilot cohort experience) will set the final number. No cohort pricing is publicized until that data is in hand.

No annual plan at launch. Monthly-only lets users churn easily, which surfaces product weaknesses faster. Annual pricing ships once monthly retention is understood (likely month 4–6 of alpha).

---

## 9. Rollout Plan

### Phase 1 — Alpha (now)

- Free + Pro tiers live.
- Stripe integration for Pro.
- Cohort waitlist signup: **not yet visible.** Data model exists; UI does not.
- Focus: instrument everything, iterate on paywall UX, hit Free → Pro conversion target.

### Phase 2 — Pilot cohort (founder-led, free)

- Trigger: alpha has been live long enough to have a stable Pro base (likely month 3–5).
- Founder hand-picks 5–10 Pro users for a free 6-week pilot cohort.
- Cohort waitlist tile goes live in UI *during* pilot, not before.
- Purpose: build the cohort playbook, identify failure modes, generate testimonials.

### Phase 3 — First paid cohort

- Founder-led, ~10 seats, ~$299.
- Still no external mentors.
- Purpose: validate pricing and delivery economics.

### Phase 4 — Mentor marketplace (out of scope for this PRD)

- External mentors onboarded via revenue-share (60/40 favoring platform).
- Ideally sourced from cohort alumni who've completed the program.
- Separate PRD to follow.

---

## 10. Risks & Open Questions

### Risks

- **Free tier too generous.** Users complete one pattern and churn satisfied. Mitigation: instrument paywall carefully, A/B test free tier boundary in month 2–3 if conversion is below target.
- **Free tier too stingy post-trial.** Users who don't convert in 7 days feel bait-and-switched. Mitigation: the "first pattern forever" floor exists specifically to prevent this.
- **Pro pricing too low.** Leaves revenue on the table and may signal lower perceived value. Mitigation: revisit at month 6 with data.
- **Cohort demand never materializes.** Waitlist stays small, cohort tier never launches. This is fine — the product works as a two-tier SaaS indefinitely.
- **Cohort launch pulls focus from Pro tier improvements.** Real founder-time risk. Mitigation: the "run one free pilot before anything else" gate is partly about forcing the founder to experience cohort workload firsthand before scaling it.
- **Stripe / billing complexity eats engineering time.** Mitigation: use Stripe Checkout (hosted) rather than custom billing UI for alpha.

### Open questions

- Exact paywall copy and UX — worth an explicit design pass before ship.
- Do we offer a "pause subscription" option, or just cancel/resubscribe? (Recommend: start simple with cancel-only.)
- How are existing Pro users grandfathered when pricing eventually changes?
- Student / early-supporter discounts — defer, but note demand if it surfaces.
- Whether themed tracks (SWE / Quant / AI) should influence tier pricing in future (e.g., a Quant-specific Pro tier). Defer.

---

## 11. Appendix

### A. Competitive pricing reference

| Product | Price | Notes |
|---|---|---|
| LeetCode Premium | ~$35/mo or ~$159/yr | Massive problem library, company-specific filters |
| NeetCode Pro | ~$15–20/mo | Curated problems + video solutions |
| AlgoExpert | ~$99/yr | Video-heavy, annual-only |
| Grokking the Coding Interview (Design Gurus) | ~$89 one-time per course | Pattern-based, static |
| Exercism | Free + paid mentorship | Open-source model, closest to cohort vision |
| Scrimba | ~$15–20/mo | Interactive coding tutorials, no cohort |

### B. Future cohort playbook (out of scope, placeholder)

- Founder-led pilot → paid founder cohort → alumni TAs → external mentors → marketplace.
- Detailed playbook deferred to post-pilot PRD.

### C. Open design items

- Pricing page layout.
- Paywall modal copy and visual design.
- Cohort waitlist tile copy (for when it ships in Phase 2).
