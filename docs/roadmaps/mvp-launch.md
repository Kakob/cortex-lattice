# Roadmap to MVP Launch

**Status:** In Progress
**Created:** 2026-03-25
**Goal:** Ship Cortex Lattice as a portfolio piece and sellable product

---

## What's Done

- [x] Next.js app with dark theme, code editor (CodeMirror + Monaco), test runner
- [x] Docker-sandboxed code execution (read-only, no network, memory/CPU limits)
- [x] Prisma + PostgreSQL schema (users, attempts, spaced repetition, contributions)
- [x] Google OAuth + credentials auth (NextAuth v5)
- [x] Core + domains architecture (core.yaml shared across themed problem.yaml files)
- [x] Domain emoji navigation on home page (🧙💊💸🖥️🚀💻)
- [x] Domain switcher dropdown in workspace
- [x] 30 AI safety prerequisite problems (complete with solutions + guidance)
- [x] 5 two-pointers algorithms with wizard-dungeon domain; pair-with-target-sum has 4 domains
- [x] Learning guide / hint system (guidance.yaml, mistakes.yaml, pause-points.yaml)
- [x] Study log + chrome extension API for tracking
- [x] Admin panel for adding problems
- [x] Private content submodule (content/ git submodule for premium domains)

---

## Phase 1: Deploy (Week 1)

The app runs locally only. Nothing else matters until it's online.

### 1.1 Cloud Database
- [ ] Set up Neon (serverless Postgres) or Railway Postgres
- [ ] Run `prisma db push` against production database
- [ ] Migrate from local docker-compose Postgres

### 1.2 Code Execution Service
- [ ] Deploy executor sandbox to Modal, Fly.io, or AWS Lambda container
- [ ] Update `app/api/execute/route.ts` to call remote executor instead of local Docker
- [ ] Maintain security: read-only, no network, memory limits, timeouts

### 1.3 App Deployment
- [ ] Deploy Next.js app to Vercel (or Fly.io if bundling executor)
- [ ] Configure environment variables (NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, DATABASE_URL)
- [ ] Set NEXTAUTH_SECRET to a real secret (currently "dev-secret-change-in-production")
- [ ] Set up custom domain
- [ ] Verify auth flow works end-to-end on production

### 1.4 CI/CD
- [ ] GitHub Actions: lint, type-check, build on PR
- [ ] Auto-deploy main branch to production

---

## Phase 2: Completion Tracking (Week 2)

Users need to see progress. The database models exist but the UI shows `solved: false` everywhere.

### 2.1 Wire Up Solved Status
- [ ] Query `StudyAttempt` (or a simpler `ProblemCompletion` table) when loading problem cards
- [ ] Pass real `solved` status through `getAllProblems()` / `getProblemsByPattern()`
- [ ] Update home page emoji indicators (dim/opacity for unsolved, bright/glow for solved)
- [ ] Show completion state per domain on the algorithm card

### 2.2 Save Completion on Success
- [ ] When all tests pass in the workspace, record completion (problem ID + domain + user ID)
- [ ] Show a success state in the workspace (congrats message, mark as solved)

---

## Phase 3: Fill Out Domain Content (Weeks 2-3)

The unique selling point is learning algorithms through different narrative domains. Right now most algorithms only have wizard-dungeon.

### 3.1 Priority Content
Each algorithm needs at minimum 3 domains to make the emoji row feel substantial.

| Algorithm | Has | Needs |
|-----------|-----|-------|
| Pair with Target Sum | 🧙💊💸🖥️ (4) | Done |
| Find Non-Duplicate Instances | 🧙 (1) | +💻 +🖥️ |
| Squaring a Sorted Array | 🧙 (1) | +💻 +🖥️ |
| Pair Distance | 🚀💻 (2) | +🧙 |
| Triplet Sum to Zero | 🧙 (1) | +💻 +🖥️ |

### 3.2 Content Generation Pipeline
- [ ] Use the generation scripts in `lib/generation/` and `scripts/` to scaffold new domains
- [ ] Each domain needs: problem.yaml (title, description, story_context, examples, hints, starter code), guidance.yaml, solution.yaml, mistakes.yaml
- [ ] Review and test each generated domain for quality

### 3.3 Add More Patterns
Two Pointers alone isn't enough to sell. Target for MVP:
- [ ] Sliding Window (3-5 algorithms)
- [ ] Binary Search (3-5 algorithms)
- [ ] Each with at least 2-3 domains

---

## Phase 4: Payment (Week 3-4)

### 4.1 Pricing Model
- **Free:** 2-3 demo problems (one full algorithm, all domains). Enough to experience the full loop — pick a domain, code it, get guided hints, see teaching moments. This is a demo, not a free tier.
- **Paid:** Everything else — all algorithms, all domains, all guided content (guidance, mistakes, pause points), crowdsourced insights.
- **Price:** $12/month or $99/year (annual saves ~30%)
- **Content split:** Public repo has the engine + demo problems. Private submodule (`content/`) has all paid content. Open-source the platform, monetize the content.

### 4.2 Differentiators vs Grokking ($89 one-time for 130 problems)
- Guided pedagogy (mistakes, pause points, invariants) — structured teaching, not just solutions
- Domain narratives — same algorithm, different stories. More engaging AND more practice reps
- Crowdsourced guidance — real learner insights curated into the guidance system (grows over time)

### 4.3 Stripe Integration
- [ ] Install Stripe SDK (`stripe` + `@stripe/stripe-js`)
- [ ] Create subscription products in Stripe dashboard (monthly + annual)
- [ ] Add `subscriptionStatus`, `stripeCustomerId`, `subscriptionEndDate` to User model in Prisma
- [ ] Webhook endpoint (`/api/webhooks/stripe`) to handle subscription lifecycle
- [ ] Gate content: check subscription before loading problems from private submodule
- [ ] Checkout flow: "Start free" → demo problems → paywall when trying to access paid content
- [ ] Show lock icon on non-demo problem cards for unauthenticated/free users

### 4.4 Demo Problem Selection
- [ ] Pick one algorithm (e.g., Pair with Target Sum) as the free demo — all 4 domains playable
- [ ] All other algorithms show as locked with a "Subscribe to unlock" CTA
- [ ] Locked cards still show the algorithm name + domain emojis (so users see what they'd get)

---

## Phase 5: Landing Page + Polish (Week 4)

### 5.1 Landing Page
- [ ] Separate marketing page at `/` (move app to `/app` or `/problems`)
- [ ] Or: unauthenticated visitors see landing page, authenticated users see problem browser
- [ ] Hero: "Learn algorithms through stories, not memorization"
- [ ] Show domain examples (wizard dungeon screenshot vs finance screenshot)
- [ ] Pricing section
- [ ] CTA to sign up / start free

### 5.2 UI Polish
- [ ] Remove TODO banner
- [ ] Add loading states (skeleton screens for problem list, workspace)
- [ ] Error boundaries
- [ ] Mobile responsiveness pass
- [ ] Meta tags / Open Graph images for sharing

### 5.3 Analytics + Monitoring
- [ ] Sentry for error tracking
- [ ] Basic analytics (PostHog or Plausible) — page views, problem starts, completions
- [ ] Uptime monitoring

---

## Phase 6: Launch (Week 5)

### 6.1 Pre-Launch
- [ ] Test full flow: sign up → browse → pick domain → solve → complete → see progress
- [ ] Test payment flow: subscribe → access premium → cancel → lose access
- [ ] Test on mobile
- [ ] Write 3-5 social posts showing the domain concept (same algorithm, different stories)

### 6.2 Launch Channels
- [ ] Portfolio site link
- [ ] Twitter/X thread showing the product
- [ ] r/learnprogramming, r/cscareerquestions
- [ ] Hacker News Show HN
- [ ] LinkedIn post

### 6.3 Post-Launch
- [ ] Monitor errors and performance
- [ ] Respond to feedback
- [ ] Track conversion: free sign-up → paid subscriber
- [ ] Add more patterns and domains based on demand

---

## Content Target for MVP

| Pattern | Algorithms | Domains per Algorithm | Total Problems |
|---------|-----------|----------------------|----------------|
| Two Pointers | 5 | 3-4 each | ~17 |
| Sliding Window | 4 | 2-3 each | ~10 |
| Binary Search | 4 | 2-3 each | ~10 |
| **Total** | **13** | | **~37 themed problems** |

Plus 30 AI safety prerequisites = **~67 problems at launch**.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Code execution costs at scale | Rate limit demo users, use Modal's pay-per-use pricing |
| Content quality from generation | Human review pass on every generated domain |
| Low conversion to paid | Demo problems show full experience; paywall appears when hooked |
| Executor security vulnerability | Sandboxing already strong; add request signing, IP allowlisting |
| Grokking undercuts on price | Lean on differentiators: guided pedagogy, domains, crowdsourced insights |

---

## What Can Be Cut for Faster Launch

If you need to ship faster, cut in this order (least to most impactful):

1. **AI safety learning path** — nice to have, not the core product
2. **Sliding Window + Binary Search** — launch with just Two Pointers, add more post-launch
3. **Stripe / payment** — launch free, add payment after validating demand
4. **Landing page** — use the home page as-is, add landing page later

**Absolute minimum MVP:** Deploy + completion tracking + 5 two-pointers algorithms with 3 domains each. That's Phases 1-2 + partial Phase 3.
