# AI Safety Engineering Learning Path

**Complete teaching materials for implementing AI safety research papers**

This package contains structured learning materials for your AI Safety Engineer journey, designed for the Cortex Lattice platform.

---

## 📁 Structure

```
ai-safety-learning-path/
├── dsa-prerequisites/          # 16 foundational DSA problems
│   ├── 01-matrix-multiplication/
│   ├── 02-softmax-numerical-stability/
│   ├── 03-dot-product-attention/
│   ├── 04-positional-encoding/
│   ├── 05-layer-normalization/
│   ├── 06-circular-buffer-replay/
│   ├── 07-cumulative-discounted-sums/
│   ├── 08-clipping-functions/
│   ├── 09-kl-divergence/
│   ├── 10-binary-search-threshold/
│   ├── 11-graph-path-finding/
│   ├── 12-lru-cache/
│   ├── 13-parallel-prefix-sum/
│   ├── 14-topk-sampling/
│   ├── 15-cosine-similarity/
│   └── 16-running-statistics/
│
└── paper-implementations/      # 14 AI Safety paper implementations
    ├── 01-mini-gpt/           # Transformer from scratch
    ├── 02-ppo/                # PPO algorithm
    ├── 03-rlhf/               # RLHF pipeline
    ├── 04-constitutional-ai/  # Self-improving safety
    ├── 05-reward-hacking/     # Detecting specification gaming
    ├── 06-adversarial-prompts/ # Jailbreak defense
    ├── 07-multi-objective-rlhf/ # Balancing objectives
    ├── 08-safety-testing/     # Systematic evaluation
    ├── 09-activation-steering/ # Behavior control
    ├── 10-circuit-analysis/   # Mechanistic interpretability
    ├── 11-neural-probes/      # Understanding representations
    ├── 12-kv-cache/           # Efficient inference
    ├── 13-distributed-training/ # Scaling training
    └── 14-end-to-end-safety/  # Complete safety system
```

---

## 📄 File Types

Each problem/paper contains:

| File | Purpose |
|------|---------|
| `problem.yaml` | Problem definition, examples, constraints, prerequisites |
| `solution.py` | Reference implementation with detailed comments |
| `guidance.yaml` | 4-category hint system (Key Concepts, Common Mistakes, Real-World, Solution Approach) |

---

## 🎯 Learning Progression

### Prerequisites Phase (DSA)
Master these foundational patterns before diving into papers:

| # | Topic | Why It Matters |
|---|-------|----------------|
| 01 | Matrix Multiplication | Core of attention mechanism |
| 02 | Softmax Stability | Prevents NaN in training |
| 03 | Dot-Product Attention | Heart of transformers |
| 04 | Positional Encoding | Position awareness |
| 05 | Layer Normalization | Training stability |
| 06 | Replay Buffer | Experience storage for RL |
| 07 | Discounted Sums | Computing returns in RL |
| 08 | Clipping Functions | PPO stability mechanism |
| 09 | KL Divergence | RLHF regularization |
| 10 | Binary Search | Threshold optimization |
| 11 | Graph Path Finding | Circuit analysis |
| 12 | LRU Cache | KV cache foundation |
| 13 | Parallel Prefix Sum | GPU-friendly operations |
| 14 | Top-K Sampling | LLM text generation |
| 15 | Cosine Similarity | Embedding comparison |
| 16 | Running Statistics | Online normalization |

### Paper Implementation Phase

**Foundations (Start Here)**
1. **Mini-GPT** - Build a transformer from scratch
2. **PPO** - The RL algorithm behind RLHF
3. **RLHF** - Complete alignment pipeline

**Safety Techniques**
4. **Constitutional AI** - Self-improving safety
5. **Reward Hacking Detector** - Catch specification gaming
6. **Adversarial Prompt Detector** - Defense against jailbreaks
7. **Multi-Objective RLHF** - Balance helpfulness & harmlessness

**Evaluation & Testing**
8. **Safety Testing Framework** - Systematic evaluation

**Interpretability**
9. **Activation Steering** - Control via activations
10. **Circuit Analysis** - Understand model internals
11. **Neural Probes** - What does the model know?

**Systems**
12. **KV Cache** - Efficient inference
13. **Distributed Training** - Scale to large models

**Integration**
14. **End-to-End Safety** - Complete system

---

## 🚀 Quick Start

### For a Single Problem

```python
# Read the problem
with open("dsa-prerequisites/01-matrix-multiplication/problem.yaml") as f:
    problem = yaml.safe_load(f)

# Try to solve it yourself first!

# If stuck, check guidance.yaml for hints
# Categories: key_concepts, common_mistakes, real_world, solution_approach

# Finally, compare with solution.py
```

### Suggested Daily Practice

1. **Morning (1-2 hrs)**: Work on 1 DSA prerequisite
2. **Afternoon (2-3 hrs)**: Work on current paper implementation
3. **Evening (30 min)**: Review and document learnings

---

## 📚 Key Papers Referenced

| Paper | Authors | Year | Implementation |
|-------|---------|------|----------------|
| Attention Is All You Need | Vaswani et al. | 2017 | 01-mini-gpt |
| PPO Algorithms | Schulman et al. | 2017 | 02-ppo |
| InstructGPT | Ouyang et al. | 2022 | 03-rlhf |
| Constitutional AI | Bai et al. | 2022 | 04-constitutional-ai |
| Transformer Circuits | Anthropic | 2021 | 10-circuit-analysis |

---

## 🎮 Integration with Cortex Lattice

These files follow the Cortex Lattice teaching format:

1. **problem.yaml** → Displayed in the problem panel
2. **solution.py** → Used for validation and shown after completion
3. **guidance.yaml** → Powers the 4-category hint accordion

The hint system provides:
- 💡 **Key Concepts** - Core patterns and insights
- ⚠️ **Common Mistakes** - What to watch out for
- 🌍 **Real-World Examples** - Where this appears in practice
- 🎯 **Solution Approach** - Step-by-step algorithm

---

## 📊 Estimated Time

| Section | Problems | Time per Problem | Total |
|---------|----------|------------------|-------|
| DSA Prerequisites | 16 | 2-3 hours | 32-48 hours |
| Paper Implementations | 14 | 6-12 hours | 84-168 hours |

**Total: 116-216 hours** (roughly 3-5 months at 10-15 hrs/week)

---

## 🏆 Completion Milestones

- [ ] Complete all 16 DSA prerequisites
- [ ] Implement Mini-GPT and generate text
- [ ] Implement PPO and solve CartPole
- [ ] Complete full RLHF pipeline
- [ ] Build Constitutional AI system
- [ ] Create safety testing framework
- [ ] Implement interpretability tools
- [ ] Build end-to-end safety system

---

## 💡 Tips for Success

1. **Don't skip DSA prerequisites** - They build intuition
2. **Read the papers** - Links provided in each problem.yaml
3. **Implement first, then check** - Learn by doing
4. **Use the hint system progressively** - Don't reveal all at once
5. **Document your journey** - Build in public for accountability

---

## 📞 Resources

- Anthropic Research: https://anthropic.com/research
- Transformer Circuits: https://transformer-circuits.pub
- OpenAI Safety: https://openai.com/safety
- AI Safety Fundamentals: https://aisafetyfundamentals.com

---

**Good luck on your AI Safety Engineer journey!** 🚀
