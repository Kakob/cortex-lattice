# Problem Template

Use this template to create new problems for Cortex Lattice.

## Quick Start

1. **Copy this directory:**
   ```bash
   cp -r problems/_template problems/your-problem-id
   ```

2. **Fill in the YAML files** (see below for what's required)

3. **Test in browser:**
   ```bash
   npm run dev
   # Visit http://localhost:3000/problems/your-problem-id
   ```

## Required Files

| File | Required | Purpose |
|------|----------|---------|
| `problem.yaml` | **YES** | Problem statement, test cases, starter code |
| `solution.yaml` | **YES** | Reference solution (needed for test validation) |
| `guidance.yaml` | **YES** | Teaching content for Learning Guide panel |

## Optional Files (Enhanced Teaching)

| File | Recommended | Purpose |
|------|-------------|---------|
| `mistakes.yaml` | Yes | Common errors with detection and teaching |
| `invariants.yaml` | Yes | Pattern rules and correctness proofs |

## File Checklist

### problem.yaml (Required)
- [ ] `id` matches directory name
- [ ] `title` is descriptive
- [ ] `difficulty` is set (easy/medium/hard)
- [ ] `pattern` identifies the DSA pattern
- [ ] `description` clearly states the problem
- [ ] `examples` show input/output with explanations
- [ ] `constraints` define valid input ranges
- [ ] `hints` provide progressive guidance (3 levels)
- [ ] `starter_code_python` has function signature and docstring
- [ ] `test_cases` cover basic, edge, and boundary cases

### solution.yaml (Required)
- [ ] `id` matches problem.yaml
- [ ] `solution_code_python` has working implementation
- [ ] `complexity` documents time/space analysis
- [ ] `approach_explanation` has core insight

### guidance.yaml (Required)
- [ ] `hints.key_concepts` lists main insights
- [ ] `hints.common_mistakes` warns about pitfalls
- [ ] `hints.solution_approach.steps` provides step-by-step guide
- [ ] `complexity` matches solution.yaml

## Naming Convention

Use this pattern for problem IDs:
```
{pattern}-{descriptive-name}
```

Examples:
- `two-pointers-asteroid-belt`
- `sliding-window-network-packets`
- `binary-search-sorted-matrix`
- `dynamic-programming-knapsack`

## Test Your Problem

1. **Load test:** Does the problem appear in the browser?
2. **Starter code:** Does it compile without errors?
3. **Test cases:** Do they all pass with the reference solution?
4. **Learning guide:** Does guidance content display correctly?

## Example Problems

See these completed problems for reference:
- `problems/two-pointers-asteroid-belt/` - Full example with all files

## Tips

- Keep descriptions concise but complete
- Write test cases that cover edge cases
- Make hints progressively more specific
- Connect to real-world applications when possible
- Use the story_context to make problems engaging
