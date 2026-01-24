# Cortex Lattice

A cross-domain pattern education platform that teaches professional problem-solving patterns through interactive coding challenges.

## What This Is

Cortex Lattice teaches the 30-80 core patterns that experts use in professional fields (Software Engineering, Electrical Engineering, Physics, Aerospace) through hands-on coding problems with intelligent mistake detection and interactive learning.

**The Core Insight:** Every professional field contains a finite set of reusable patterns that experts recognize and apply. We make these patterns visible, teachable, and transferable across domains.

## Current Status

🚧 **Early Development** - Building MVP with first theme (Software Engineering patterns)

Currently working on: First challenge "Two Pointers - Asteroid Belt" to validate the teaching framework and establish content creation workflow.

## The Innovation

Unlike traditional coding platforms that just say "Wrong Answer", Cortex Lattice:

- **Detects exactly where your mental model diverges** - Uses invariant checking and trace analysis to pinpoint specific misunderstandings
- **Shows side-by-side visualizations** - Your approach vs. optimal solution, making the difference crystal clear
- **Interactive pause points** - Active learning moments that force pattern recognition, not passive watching
- **Teaches transferable patterns** - Learn once, apply everywhere across domains

### The 4-File Teaching System

Each problem consists of:

1. **problem.yaml** - Problem statement, examples, test cases, constraints
2. **invariants.yaml** - What MUST be true for the algorithm to work correctly (how experts think)
3. **mistakes.yaml** - Common errors, how to detect them, and intelligent teaching moments
4. **pause-points.yaml** - Interactive moments where learners predict next steps

This framework transforms passive problem-solving into active pattern learning.

## Why This Matters

**Current education is broken:**
- Theory disconnected from practice → Takes 4-6 years
- Knowledge stays siloed → EE students don't learn from CS patterns
- Passive learning → Low retention, slow mastery

**Cortex Lattice approach:**
- Learn by doing from day 1 → Compressed timeline (months, not years)
- Cross-domain pattern transfer → Recognize Fourier Transforms in EE, Physics, and Finance
- Active learning with intelligent guidance → Deep pattern understanding

## Themes (Knowledge Domains)

### Phase 1: Foundation (Months 1-12)
- **Software Engineering** - DSA patterns, algorithms, system design (~30-50 patterns)
- **Electrical Engineering** - Circuit analysis, signal processing, embedded systems (~60-80 patterns)
- **Physics/Applied Math** - Mechanics, E&M, numerical methods (~30-50 patterns)

### Phase 2: Specialization (Year 2+)
- **Aerospace Engineering** - Orbital mechanics, propulsion, structures
- **Mechanical Engineering** - Statics, dynamics, FEA, materials
- **Advanced domains** - Biotech, Climate/Energy, Finance, Robotics

Each theme contains 30-80 coding challenges teaching the core patterns professionals use daily.

## Repository Structure

```
cortex-lattice/
├── docs/              # Vision, framework, architecture
├── examples/          # Sample problems demonstrating teaching system
└── (coming soon)      # Platform code as we build
```

## Business Model

**Individual:** $997/year (early pricing, value-based on outcomes)
**Corporate:** Tiered pricing for organizational training
**Open-core:** Visualization engine and basic problems open-source, premium content proprietary

**Philosophy:** Worker-owned cooperative structure. Contributors receive meaningful equity.

## Long-Term Vision

This platform becomes infrastructure for human knowledge transfer - making professional patterns visible, teachable, and transferable. 

**Connection to aerospace:** The platform trains engineers, becomes recruiting pipeline, enables crowdsourced R&D for future worker-owned rocket company.

## Quick Start

Coming soon - currently in design/planning phase. Watch this repo for updates as we build the MVP.

## Contributing

Not accepting contributions yet - focusing on establishing core framework and first theme. Will open up once foundation is solid.

## Timeline

- **Week 1:** Complete first problem, validate 3-4 hour creation estimate
- **Month 1:** 10 Tier 1 problems, basic trace analyzer, simple UI
- **Month 3:** Complete Software Engineering theme (30 problems), public launch

## Contact

Built by Jacob - learning by creating, building in public.

## License

MIT License - See LICENSE file for details
