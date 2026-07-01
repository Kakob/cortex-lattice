# Cortex Lattice — Architecture

Cortex Lattice is a Next.js 14 application that teaches coding patterns through interactive Python problems, with an accompanying Chrome extension that tracks practice on third-party platforms (LeetCode, DesignGurus) and schedules spaced-repetition reviews.

The system has three deployable surfaces:

- **Web app** — Next.js App Router, server-rendered problem workspace, NextAuth, Prisma + PostgreSQL.
- **Execution sandbox** — Modal-hosted Python endpoint (with local Docker fallback) that runs user code against test cases.
- **Chrome extension** — A Vite-built extension whose content scripts scrape problem pages and whose service worker mirrors all data into the web app's database over HTTP.

Components below are ordered by interview load-bearing weight: the things an employer will ask you to walk through first.

---

## 1. Code Execution Sandbox

**Files:** `app/api/execute/route.ts`, `executor/modal_executor.py`, `executor/run_tests.py`, `executor/Dockerfile`

Receives Python solutions from the browser, runs them against per-problem test cases in an isolated environment, and returns a structured pass/fail result.

**How it works.** The Next.js POST route (`app/api/execute/route.ts`) authenticates via `auth()`, validates the problem ID against a path-traversal regex (`/^[a-zA-Z0-9_-]+$/`), and routes execution to one of two backends:

- **Modal (primary, production).** `executeViaModal` HTTP-POSTs `{ code, problem_yaml }` to a Modal FastAPI endpoint (`modal_executor.py`) defined as a `@modal.fastapi_endpoint` on a debian-slim + PyTorch image with a 30 s function timeout and 512 MB memory cap. Modal handles per-request sandboxing.
- **Docker (local dev fallback).** `executeViaDocker` writes the user's code and a merged `problem.yaml` to a per-request `.tmp/exec-*` directory, then `docker run`s `cortex-executor:latest` with `--network=none --read-only --memory=512m --cpus=1 --tmpfs=/tmp:noexec,nosuid` and read-only volume mounts. Concurrency is bounded by a 3-slot in-process semaphore (`acquireLock`/`releaseLock` with a promise-based wait queue).

Both backends shell out to `executor/run_tests.py`, which `exec()`s the user code into an isolated namespace, auto-detects the function to test (parses the starter code's `def` line, then falls back to a list of common names), and runs each test case under a `signal.SIGALRM` per-test timeout (2 s). Output normalization rounds floats and recurses into lists/dicts before comparison. Results are emitted as JSON on stdout.

**Key dependencies:** Modal SDK, Docker daemon (fallback), NextAuth session, `buildMergedProblemYaml` from `lib/problems.ts`.

---

## 2. Themed Problem Loading Pipeline

**Files:** `lib/problems.ts`, `lib/types.ts`, `lib/schemas/problemSchema.ts`, `problems/<id>/{core.yaml,invariants.yaml,themes/<theme>/{problem.yaml,solution.yaml,guidance.yaml,mistakes.yaml}}`

Loads a problem definition from disk, merging an algorithm-invariant **core** file with a domain-specific **theme** overlay, so the same algorithm can be presented as a wizard-dungeon, finance, medical, or coding-interview problem without duplicating test cases.

**How it works.** `loadProblem(id, themeId?)` first reads `problems/<id>/core.yaml` (test cases, constraints, complexity, pattern metadata). If present, it calls `loadThemedProblem`, which resolves the theme path by checking `problems/<id>/themes/<theme>/` first, then a private git-submodule path at `content/themes/<id>/<theme>/`. If the requested theme is missing it cascades: requested → `coding-interview` default → first available. The themed `problem.yaml` provides the title, description, story context, hints, and starter code; these are merged with the core's test data into a unified `Problem` object.

Auxiliary loaders (`loadSolution`, `loadGuidance`, `loadMistakes`, `loadInvariants`, `loadPausePoints`) use `resolveThemedFile`, which checks the theme directory first and falls back to the problem root, so a theme can override any subset of files.

For the executor, `buildMergedProblemYaml` flattens the core + theme back into the legacy single-file schema the Python test runner expects. `buildLearningGuide` and `buildCategorizedHints` assemble the UI's right-rail content (Key Concepts / Common Mistakes / Project Context / Paper Reference / Solution Approach) from this merged data.

Listing helpers (`getAllProblems`, `getProblemsByCategory`, `getProblemsByPattern`) glob both `core.yaml` (new format) and `problem.yaml` (legacy single-file format) so the catalog supports both. The content directory is detected once and cached in module scope.

**Key dependencies:** `yaml` parser, `glob`, Node `fs/promises`. Read by the execute API, problem pages (`app/problems/[id]/page.tsx`), and the generation scripts.

---

## 3. Authentication & Cross-Origin Session

**Files:** `auth.ts`, `auth.config.ts`, `middleware.ts`, `lib/auth/actions.ts`, `prisma/schema.prisma` (User/Account/Session)

NextAuth v5 (Auth.js) backed by Prisma, with cookie settings tuned so the Chrome extension can reuse the web session.

**How it works.** Two configs split for the Edge runtime constraint:

- `auth.config.ts` is Edge-safe (no Prisma) and is imported by `middleware.ts`. It defines providers, the `authorized` callback (returns `401 JSON` for protected API paths, redirects for auth pages), and `jwt`/`session` callbacks that hoist `user.id` from the JWT into the session.
- `auth.ts` adds the `PrismaAdapter`, the bcrypt `Credentials.authorize` implementation, and a cookie override: `SameSite=None; Secure; httpOnly`. The non-default `SameSite=None` is what makes the cookie travel on the extension's cross-origin `fetch(..., { credentials: 'include' })` calls.

`middleware.ts` wraps the NextAuth middleware. For any path under `/api/extension/`, it reflects the request `Origin` header back as `Access-Control-Allow-Origin` (only if it starts with `chrome-extension://` or `http://localhost`) and answers `OPTIONS` preflights with `204` — required because the extension lives at a different origin than the API but needs to send the session cookie.

`lib/auth/actions.ts` is a Next server action for email/password registration: validates inputs, hashes with `bcrypt(12)`, and inserts a `User` row.

**Key dependencies:** `next-auth@5-beta`, `@auth/prisma-adapter`, `bcryptjs`, Google OAuth provider, `lib/db.ts` (Prisma client singleton).

---

## 4. Spaced Repetition Scheduler

**File:** `extension/src/utils/spaced-repetition.ts`, schema: `StudySpacedRepetition`, `StudyReviewResult` in `prisma/schema.prisma`

A modified SM-2 algorithm that decides when each tracked problem should resurface for review.

**How it works.** Two pure functions:

- `calculateInitialInterval(wasMultiAttempt, confidence?, usedHint?, usedAI?, viewedSolution?)` — on first solve, returns an interval in days. Cold first-try solves get 4 / 3 / 1 days based on user-rated confidence (`easy` / `moderate` / `lucky`). Multi-attempt solves get progressively shorter intervals as the user accepted more help (no help → 2 d, hint → 1 d, AI → 12 h, viewed solution → 4 h).
- `calculateNextInterval(currentIntervalDays, currentEaseFactor, passed, wasMultiAttempt, ...)` — at review time. Failure or viewing the solution resets to 4 h and decrements ease (floor 1.3). Success multiplies the current interval by an effort-weighted multiplier (cold solve × 2.0, hint × 1.5, AI × 1.2) and then by the ease factor (clamped 1.3–2.5). The result is capped at 180 days.

State lives in `StudySpacedRepetition` (one row per `StudyProblem`: `nextReview`, `intervalDays`, `easeFactor`, `reviewCount`). Every review writes a `StudyReviewResult` audit row. The service worker's hourly alarm (`check-reviews`) calls `getReviewsDue()` and pops a Chrome notification when any are due.

**Key dependencies:** Called from `extension/src/db/operations.ts` (`completeReview`), `extension/src/background/alarm-manager.ts`, and `app/api/extension/spaced-repetition/route.ts` for persistence.

---

## 5. Chrome Extension Tracking Pipeline

**Files:** `extension/src/content/{index.ts,observer.ts,detector.ts,scraper-leetcode.ts,scraper-grokking.ts,modal-manager.ts}`, `extension/src/background/{service-worker.ts,message-handler.ts,alarm-manager.ts}`, `extension/src/db/operations.ts`, `extension/src/utils/api.ts`

A content-script + service-worker pair that detects when the user is on a supported problem page, scrapes title/code/difficulty, opens an attempt, snapshots code on every Run/Submit, and prompts for reflections.

**How it works.** On page load, `content/index.ts` calls `detectPlatform()` to identify LeetCode vs DesignGurus from the URL, then instantiates the matching scraper. Each scraper exposes `getTitle()`, `getCode()`, `getDifficulty()`: LeetCode pulls code from the global `window.monaco` editor instance (falling back to `.view-lines` text scraping or CodeMirror); DesignGurus uses its own DOM hooks.

`setupObserver` installs `MutationObserver`s on the Run/Submit buttons. On click it captures the current code and `chrome.runtime.sendMessage`s `SAVE_SNAPSHOT` to the service worker, plus `START_ATTEMPT` / `END_ATTEMPT` around the session. A second observer watches the test-result panel and forwards `lastTestResult`.

The service worker (`background/service-worker.ts`) is the central message hub. Every content-script message lands in `handleMessage`, which delegates to `db/operations.ts`. Operations call the web app's API (`utils/api.ts`) with `credentials: 'include'` so the NextAuth session cookie authenticates the request — there is **no local extension storage**; PostgreSQL is the single source of truth. The service worker also owns the `check-reviews` alarm and the `quick-log` keyboard command.

`modal-manager.ts` injects a Shadow-DOM UI for reflection / stuck-point prompts so the extension's styles don't collide with the host page.

**Key dependencies:** Chrome extension APIs (`runtime`, `alarms`, `commands`, `notifications`), Vite build, the web app's `/api/extension/*` route group, NextAuth cookies.

---

## 6. Slash-Command Contribution System

**Files:** `lib/slashCommands/{parser.ts,handler.ts,autoLink.ts,context.ts,index.ts}`, `components/{SlashAutocomplete.tsx,CommandNotification.tsx,CodeEditor.tsx}`, `hooks/useSlashCommands.ts`, `hooks/useSessionContext.ts`, `app/api/contributions/route.ts`, `app/api/contribution-links/route.ts`

In-editor `/problem`, `/solution`, and `/guidance` commands that let users log confusion points and breakthroughs as they code; later auto-linked into a graph.

**How it works.** As the user types in Monaco/CodeMirror, `useSlashCommands` watches the active line. `isTypingSlashCommand` triggers the `SlashAutocomplete` popover with suggestions from `getAutocompleteSuggestions`. On Enter, `parseSlashCommand` (in `parser.ts`) validates the command tree against `VALID_COMMANDS` and `VALID_SUBCOMMANDS`, extracts quoted content via a single-pass regex that handles `\"`/`\'` escapes, and for `/guidance /select` collects bare-word references followed by quoted content.

`handler.ts` posts to `POST /api/contributions` with the parsed payload plus the current session context (sessionId, problemId, time-since-start, attempt count, revealed hints, test results). For `/solution new` it then calls `fetchRecentProblems`, runs each candidate through `autoLink.shouldAutoLink` (Jaccard similarity on text tokens length > 2, plus a recency bonus, capped at 0.95 confidence), and posts each link above the 0.5 threshold to `/api/contribution-links` flagged `autoGenerated: true` with the confidence score.

Server-side, contributions persist to `InlineContribution` and links to `ContributionLink` (both in `prisma/schema.prisma`); the link table has a composite unique key on `(from, to, type)` so re-runs are idempotent.

**Key dependencies:** `useSlashCommands` hook, the contribution and contribution-link Next.js API routes, Prisma, the Monaco/CodeMirror editor wrappers.

---

## 7. AI-Assisted Problem Generation

**Files:** `scripts/generate-problem.ts`, `lib/generation/{prompts.ts,patterns.ts,parser.ts,validator.ts,runner.ts}`, `lib/curriculum.ts`

A CLI that uses Anthropic Claude to generate new themed problems against the 235-problem GTCI curriculum, with a two-phase pipeline that functionally verifies the generated solution before committing the themed content.

**How it works.** Invoked as `npm run generate -- --pattern two-pointers --index 0` (single) or `npm run generate:batch`. Inputs come from `lib/curriculum.ts` (`GTCI_CURRICULUM`: title, pattern, difficulty, index).

- **Phase A** — `buildPhaseAPrompt` constructs a system prompt embedding the pattern metadata from `patterns.ts` (name, when-to-use, code template, key concepts) plus two exemplar YAMLs. Claude returns `core.yaml` (algorithm-invariant: ≥ 8 test cases, constraints, complexity, pattern signature) and `solution.yaml` (Python + JS reference solutions with `approach_explanation`). Each file is structurally validated with the Zod schemas in `validator.ts`, then `runner.ts` materializes a merged `problem.yaml` plus the solution into a temp dir and runs it through the same Docker sandbox the production API uses. Functional failure triggers up to 3 `buildRetryPrompt` retries that include the failing test details. Cross-validation in `crossValidateCore` re-checks that `edge_cases.test_id` references actually exist in `test_case_data`.

- **Phase B** — Once Phase A passes, `buildPhaseBPrompt` is run once per requested theme (`wizard-dungeon`, `software-engineering`, `finance`, `medicine` by default) to generate the themed `problem.yaml`, `guidance.yaml`, `mistakes.yaml`, and `invariants.yaml`. Output is parsed by `parser.ts` (extracts fenced YAML blocks) and validated against the matching Zod schema.

The output tree is written to `problems/<pattern>-<slug>/{core.yaml, solution.yaml, themes/<theme>/...}`, matching the layout `lib/problems.ts` expects.

**Key dependencies:** `@anthropic-ai/sdk`, `zod`, `yaml`, the same Docker image used by the execute API, `lib/generation/patterns.ts` (the pattern catalog).

---

## 8. Database Schema

**File:** `prisma/schema.prisma`, client singleton in `lib/db.ts`

PostgreSQL via Prisma. Three logical groupings:

- **NextAuth tables** — `User`, `Account`, `Session`, `VerificationToken`. Standard Auth.js + Prisma adapter shape, with `User.password` added for the credentials provider.
- **Contribution graph** — `InlineContribution` (slash-command output: command/subcommand/content, denormalized session and problem IDs, JSON `context`/`references`) and `ContributionLink` (typed directed edges with optional `confidenceScore` for auto-generated links; unique on `(from, to, linkType)`).
- **Practice tracking (extension)** — `StudyProblem` (one per unique URL, with `normalizedTitle` + `pattern` + `curriculumTrack/Index` resolved against `lib/curriculum.ts` at insertion), `StudyAttempt` (per session on a problem; `passed`, `snapshotCount`), `StudySnapshot` (code at each Run/Submit), `StudyStuckPoint` (user-logged blockers with intended action), `StudyReflection` (free-form notes with optional `confidence`), `StudySpacedRepetition` (the SM-2 state machine), `StudyReviewResult` (audit log of every review).

Most tables carry an `odl` (offline-durable local ID) generated client-side by the extension so retries are idempotent. `onDelete: Cascade` chains all study data to the owning `User`.

**Key dependencies:** Prisma client, NextAuth adapter, contribution and extension API routes.

---

## 9. Code Editor & Workspace UI

**Files:** `components/ProblemWorkspace.tsx`, `components/CodeEditor.tsx`, `components/editors/{MonacoEditor.tsx,CodeMirrorEditor.tsx}`, `components/{TestResults.tsx,LearningGuide.tsx,HintSystem.tsx,BottomSheet.tsx,BlurReveal.tsx}`, `hooks/{useCodePersistence.ts,useMediaQuery.ts,useRevealState.ts,useHintState.ts}`, `lib/approachDetection.ts`

The problem-solving page: editor on top, collapsible test panel below, a bottom-sheet `LearningGuide` overlay, and a theme switcher.

**How it works.** `CodeEditor.tsx` `lazy()`-imports Monaco for desktop and CodeMirror for mobile, chosen by `useIsMobile()`. `useCodePersistence(problemId, starterCode)` debounces edits (500 ms) into `localStorage` under `cortex-code-<id>` and clears the entry when the user resets to starter — so a refresh restores work without round-tripping the server. The editor also wires in `useSlashCommands` for the contribution flow.

`LearningGuide` shows three blurred sections (Problem Statement / Guidance / Solution & Explanation). `useRevealState` persists per-card reveal state to `localStorage` so progressive disclosure survives navigation; `BlurReveal` is the visual primitive. For the solution section, `detectApproach` (`lib/approachDetection.ts`) heuristically picks which alternative the user is implementing: it strips the starter prefix, drops comments and docstrings, requires ≥ 40 chars of meaningful delta, then scores each approach's `signatureTokens` (case-insensitive regexes) against the code — the high score wins. The matched card is highlighted but stays blurred so the user has to choose to reveal it.

`ProblemWorkspace` owns execution state: `handleRunCode` calls `executeCode` in `lib/api.ts` (which POSTs to `/api/execute`), surfaces the `ExecutionResult` in `TestResults`, and threads `themeId` through so a domain-switched problem runs the right merged YAML.

`ChunkErrorRecovery.tsx` (mounted in the root layout) catches `ChunkLoadError` from post-deploy hash mismatches: it auto-reloads once per 10 s (session-storage guard to break loops) and polls `/api/version` every 5 minutes plus on `focus` to compare `NEXT_PUBLIC_BUILD_ID` and toast a refresh prompt.

**Key dependencies:** `@monaco-editor/react`, `codemirror`, `framer-motion`, `lucide-react`, the execute API, the contribution API.
