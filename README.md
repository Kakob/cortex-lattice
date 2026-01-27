# Cortex Lattice

An AI safety learning platform that teaches professional problem-solving patterns through interactive coding challenges mapped to frontier AI research papers.

## What This Is

Cortex Lattice teaches the data structures and algorithms needed to implement frontier AI safety research. Instead of abstract LeetCode-style problems, every challenge maps directly to real code you'll write when implementing papers like:

- **Attention is All You Need** (Transformers)
- **Proximal Policy Optimization** (PPO)
- **InstructGPT** (RLHF)
- **Constitutional AI**
- **Flash Attention**
- And 9 more foundational AI safety papers

**The Core Insight:** Every AI safety paper requires 5-10 core algorithmic patterns. Learn the pattern first, then read the paper and recognize: "Oh, this is that two-pointers pattern I just learned!"

## Current Status

Building MVP with AI Safety theme - 28 problems across 14 research papers.

Currently working on: First challenge "Two Pointers - Asteroid Belt" to validate the teaching framework.

## How It Works

### Traditional Approach (Broken)
Read paper → Don't understand the algorithms → Struggle with implementation

### Cortex Lattice Approach
Solve algorithmic problem → Understand the pattern → See exactly where it's used in the paper → Implement confidently

### Example
Before reading the Flash Attention paper, solve "Two Pointers - Attention Head Selector". Learn the pattern. THEN read Section 3.2 and recognize the optimization technique immediately.

## The Teaching System

Each problem includes a 5-category guidance system:

1. **Key Concepts** - Pattern fundamentals
2. **Common Mistakes** - Implementation pitfalls to avoid
3. **Project Context** - Where this appears in paper implementations
4. **Paper Reference** - Direct citations to research papers
5. **Solution Approach** - Step-by-step solution (last resort)

## Problem Collection (28 Problems)

### Prerequisites (4 problems)
- Attention is All You Need → Mini-GPT Implementation
- Proximal Policy Optimization → PPO Implementation

### Foundations (4 problems)
- InstructGPT → RLHF Implementation
- Constitutional AI → Self-Improvement Systems

### Going Deeper (4 problems)
- Specification Gaming → Reward Hacking Detection
- Red Teaming → Adversarial Prompt Detection

### Advanced Safety (4 problems)
- Multi-Objective RLHF → Balancing Multiple Goals
- Safety Testing Framework → Systematic Evaluation

### Interpretability (6 problems)
- Activation Steering → Controlling Model Behavior
- Transformer Circuits → Mechanistic Interpretability
- Neural Network Probes → Representation Analysis

### Systems (4 problems)
- KV Cache Systems → Efficient Inference
- Distributed Training → Scaling to Multiple GPUs

### Integration (2 problems)
- End-to-End Safety System → Putting It All Together

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Editors:** Monaco (desktop), CodeMirror (mobile)
- **Execution:** Docker containers with Python 3.11 + PyTorch
- **Mobile-first:** iOS-style bottom sheet hint system

## Quick Start

```bash
# Install dependencies
npm install

# Build Docker executor
docker build -t cortex-executor ./executor

# Run development server
npm run dev

# Open browser
open http://localhost:3001
```

## Repository Structure

```
cortex-lattice/
├── app/                 # Next.js pages
├── components/          # React components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and API
├── problems/            # Problem content (YAML)
├── executor/            # Docker execution environment
└── docs/                # Documentation
```

## Why AI Safety?

This isn't just another coding platform. It's designed to:

1. **Build AI safety talent pipeline** - Train engineers who can implement safety research
2. **Make papers accessible** - Break down complex research into learnable patterns
3. **Enable hands-on learning** - You can't understand RLHF without implementing it

## Business Model

- **Individual:** $997/year (value-based on career outcomes)
- **Philosophy:** Worker-owned cooperative structure

## Timeline

- **Week 1:** 5 problems, mobile-first UI, Docker execution
- **Month 1:** 14 problems (one per paper), user accounts
- **Month 3:** 28 problems (complete collection), enhanced teaching
- **Month 6:** Production deployment, community features

## Contributing

Not accepting contributions yet - focusing on establishing core framework. Will open up once foundation is solid.

## Contact

Built by Jacob - learning AI safety by building, creating portfolio for frontier AI research.

## License

MIT License - See LICENSE file for details
