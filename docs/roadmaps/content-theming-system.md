# Roadmap: Content Theming System (Public/Private Split)

**Status:** Planning
**Created:** 2026-03-24

## Overview

Add narrative theming to Cortex Lattice so the same DSA algorithm can be presented as a dungeon crawler, sci-fi adventure, coding interview, etc. Premium themed content lives in a private repo mounted as a git submodule. The public repo ships a free "coding-interview" theme and the full engine.

### Themes (planned)

- **Coding Interview** (free, ships with public repo) -- standard leetcode-style presentation
- **Dungeon Crawler** -- puzzles framed as dungeon exploration
- **Sci-Fi Space Adventure** -- problems as spacecraft navigation challenges
- **Coding Job** -- workplace simulation scenarios
- More to come

---

## Architecture

### Two-Repo Structure

| Repo | Visibility | Contains |
|------|-----------|----------|
| `cortex-lattice` | Public | App framework, engine, free theme, core problem definitions |
| `RPGing-coding` | Private | Premium themes, data collection logic |

The private repo is mounted at `content/` via git submodule. The app works with or without it.

### Per-Problem Directory Structure

```
problems/two-pointers-pair-distance/
  core.yaml                         # Algorithm-level (shared across all themes)
  invariants.yaml                   # Algorithm correctness (shared)
  themes/
    coding-interview/               # Free theme (public repo)
      problem.yaml                  # Themed title, description, hints, starter code
      guidance.yaml                 # Themed guidance
      solution.yaml                 # Themed solution
      mistakes.yaml                 # Themed teaching moments

content/                            # Git submodule -> private repo
  themes/
    two-pointers-pair-distance/
      dungeon-crawler/              # Premium theme
        problem.yaml
        guidance.yaml
        solution.yaml
        mistakes.yaml
      space-adventure/              # Premium theme
        ...
```

### What's in core.yaml vs theme files

**core.yaml (algorithm-invariant, shared):**
- Pattern, difficulty, constraints, complexity analysis
- Test case data (inputs/outputs only -- no themed text)
- Edge cases, pattern signature, learning objectives
- Category for grouping (e.g., "prerequisites", "foundations")

**Theme files (narrative, per-theme):**
- Title, description, story context
- Examples with themed explanations
- Hints in theme language
- Starter code with themed function/variable names
- Solution code with themed function/variable names
- Guidance, mistakes, pause points -- all themed

### Data Flow

```
core.yaml + themes/<active>/problem.yaml
    |
    v
loadProblem(id, themeId)    <-- merges core + theme overlay
    |
    v
Problem type (existing)     <-- same interface, populated differently
    |
    +---> ProblemWorkspace component (UI)
    +---> /api/execute (merged YAML mounted in Docker, no test runner changes)
```

---

## Implementation Steps

### Step 1: Git Submodule Setup

- Add `RPGing-coding` as submodule at `content/`
- App gracefully handles `content/` not existing

### Step 2: Rename `theme` -> `category`

The existing `theme` field on problems (e.g., `theme: software-engineering`) is a category grouping, not a narrative theme. Rename it across the codebase to avoid confusion:

- `lib/types.ts` -- Problem.theme -> Problem.category, ProblemCard, ProblemGroup
- `lib/problems.ts` -- getProblemsByTheme() -> getProblemsByCategory()
- `app/page.tsx` -- update references
- YAML files -- `theme:` -> `category:`

### Step 3: Add Theme Types

New types in `lib/types.ts`:
- `CoreProblem` -- algorithm-invariant content from core.yaml
- `ThemeInfo` -- theme discovery metadata (id, display name, public/private)
- Add `themeId` and `availableThemes` to existing `Problem` type
- Add `themeId` to `ExecutionRequest`

### Step 4: Restructure Problem Content

Migrate `two-pointers-asteroid-belt/` to the new format:

1. Rename to `two-pointers-pair-distance/`
2. Extract core.yaml from current problem.yaml
3. Move narrative content to `themes/space-adventure/`
4. Create plain `themes/coding-interview/` variant
5. Keep `invariants.yaml` at problem root

**Not migrated yet:** ai-safety-learning-path problems (different YAML schema, not loaded by main listing system).

### Step 5: Theme-Aware Problem Loader

Rewrite `lib/problems.ts`:

- `loadCore(problemId)` -- loads core.yaml
- `resolveThemePath(problemId, themeId)` -- checks public themes first, then content/ (private)
- `getAvailableThemes(problemId)` -- scans both directories
- `loadProblem(problemId, themeId?)` -- merges core + theme; falls back to legacy problem.yaml for un-migrated problems
- All other loaders (`loadSolution`, `loadGuidance`, etc.) accept optional `themeId`

### Step 6: Execute API

- Accept `themeId` in request body
- For new-format problems: merge core + theme into a single problem.yaml, write to temp dir, mount in Docker
- Zero changes to the Python test runner -- it sees the same YAML schema it always has
- Legacy problems: mount problem dir directly (unchanged)

### Step 7: Update Pages & Components

- `app/problems/[id]/page.tsx` -- accept `?theme=` query param, pass to loaders
- `app/page.tsx` -- use `getProblemsByCategory()`, link to `?theme=coding-interview`
- `ProblemWorkspace` -- pass `themeId` to execute call
- Future: theme switcher dropdown in problem header

### Step 8: Update Templates

Update `problems/_template/` with:
- `core.yaml` template
- `themes/coding-interview/` template files
- Updated README with new structure

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Git submodule (not npm package) | Content files, not code. Submodule is simplest. |
| core.yaml + theme overlays (not duplicated problems) | Test case data defined once, narrative varies per theme. |
| Merged YAML for Docker (not dual mount) | Zero changes to Python test runner. |
| `?theme=` query param (not path segment) | Simpler routing, no `generateStaticParams` changes. |
| Backward-compatible loader | Un-migrated problems with root `problem.yaml` still work. |
| `coding-interview` as default theme | Free, un-themed, works without private repo. |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `content/` doesn't exist on public clones | All content/ paths wrapped in existence checks; app runs fine without it |
| Requested theme doesn't exist | Falls back to default theme, then to legacy problem.yaml |
| Test case data diverges between core and themes | Test data lives ONLY in core.yaml; themes can only add explanations |
| Breaking legacy problem loading | Loader checks for core.yaml first; if absent, uses legacy path unchanged |

---

## Verification Checklist

- [ ] App runs without `content/` directory (fresh clone)
- [ ] Problems load with coding-interview theme by default
- [ ] `git submodule update --init` brings in premium themes
- [ ] Theme switching via `?theme=` shows different narrative
- [ ] Code execution works on all themes (correct function name detected)
- [ ] Home page groups by category, not by narrative theme
- [ ] Un-migrated problems still load normally
