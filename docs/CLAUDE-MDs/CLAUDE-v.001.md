# Cortex Lattice MVP - Technical Context

**Version:** 1.0  
**Date:** January 26, 2026  
**Purpose:** AI Safety Learning Platform - Teaching DSA patterns through AI research paper implementations

---

## Project Vision

Cortex Lattice teaches professional problem-solving patterns through interactive coding challenges. This MVP focuses on **AI Safety and Alignment** - teaching the data structures and algorithms needed to implement frontier AI research papers.

### The Core Insight

Every AI safety paper requires 5-10 core algorithmic patterns. Instead of just reading papers, students learn by solving DSA problems that map directly to the code they'll write when implementing:
- Transformers (Attention is All You Need)
- RLHF (InstructGPT) 
- Constitutional AI
- Mechanistic Interpretability
- And 11 more frontier AI safety papers

### What Makes This Different

**Traditional approach:**
- Read paper → Don't understand the algorithms → Struggle with implementation

**Cortex Lattice approach:**
- Solve algorithmic problem → Understand the pattern → See exactly where it's used in the paper → Implement confidently

**Example:**
Before reading Flash Attention paper, solve "Two Pointers - Attention Head Selector" problem. Learn the pattern. THEN read Section 3.2 and recognize: "Oh, this is that two-pointers pattern I just learned!"

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  - Monaco Editor (web) / CodeMirror (mobile)            │
│  - Bottom sheet hint system (iOS Now Playing style)     │
│  - Categorized guidance (5 categories)                  │
│  - Mobile-first responsive design                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ POST /api/execute
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   API Layer (Next.js)                   │
│  - Authentication (future)                              │
│  - Job queue management                                 │
│  - Results processing                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Docker exec
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Docker Container (Python)                  │
│  - Python 3.11 + PyTorch (CPU)                          │
│  - Isolated execution environment                       │
│  - 10-second timeout, 512MB memory                      │
│  - Test runner with pass/fail results                   │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

### Project Root
```
cortex-lattice-mvp/
├── README.md
├── package.json
├── tsconfig.json
├── docker-compose.yml
│
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing page
│   │   └── problems/
│   │       └── [id]/
│   │           └── page.tsx    # Problem solving interface
│   │
│   ├── components/
│   │   ├── CodeEditor.tsx      # Monaco/CodeMirror wrapper
│   │   ├── BottomSheet.tsx     # iOS-style hint drawer
│   │   ├── HintSystem.tsx      # Categorized hints
│   │   └── TestResults.tsx     # Pass/fail display
│   │
│   └── lib/
│       ├── api.ts              # API client
│       └── types.ts            # TypeScript types
│
├── api/                         # API routes
│   └── execute/
│       └── route.ts            # Code execution endpoint
│
├── executor/                    # Docker execution environment
│   ├── Dockerfile
│   ├── run_tests.py            # Test runner
│   └── requirements.txt
│
└── problems/                    # Problem content (YAML files)
    ├── prerequisites/
    │   ├── attention-is-all-you-need/
    │   │   ├── two-pointers-attention-head-selector/
    │   │   │   ├── problem.yaml
    │   │   │   ├── solution.py
    │   │   │   └── guidance.yaml
    │   │   └── dynamic-programming-positional-encoding/
    │   │       ├── problem.yaml
    │   │       ├── solution.py
    │   │       └── guidance.yaml
    │   │
    │   └── ppo/
    │       ├── sliding-window-experience-buffer/
    │       │   ├── problem.yaml
    │       │   ├── solution.py
    │       │   └── guidance.yaml
    │       └── monotonic-stack-trust-region/
    │           ├── problem.yaml
    │           ├── solution.py
    │           └── guidance.yaml
    │
    ├── foundations/
    │   ├── instructgpt-rlhf/
    │   └── constitutional-ai/
    │
    ├── going-deeper/
    │   ├── reward-hacking/
    │   └── adversarial-prompts/
    │
    ├── advanced-safety/
    │   ├── multi-objective-rlhf/
    │   └── safety-testing/
    │
    ├── interpretability/
    │   ├── activation-steering/
    │   ├── transformer-circuits/
    │   └── neural-probes/
    │
    ├── systems/
    │   ├── kv-cache/
    │   └── distributed-training/
    │
    └── integration/
        └── end-to-end-safety/
```

---

## The 3-File Teaching Framework

Each problem consists of 3 YAML files:

### 1. problem.yaml (Required)
Standard problem definition - statement, examples, test cases, constraints

### 2. solution.py (Required)
Reference implementation in Python with comments

### 3. guidance.yaml (Required - MVP Innovation)
Categorized hint system with 5 categories:

```yaml
hints:
  # Standard algorithmic guidance
  key_concepts: [...]          # Pattern fundamentals
  common_mistakes: [...]       # Implementation pitfalls
  
  # AI Safety specific (NEW - your secret sauce)
  project_context: [...]       # Where this appears in paper implementations
  paper_reference: [...]       # Direct citations to papers
  
  # Last resort
  solution_approach: [...]     # Step-by-step solution
```

---

## Complete Problem Mapping (28 Problems)

### Theme 1: Prerequisites (4 problems)

#### Paper 1: Attention is All You Need → Mini-GPT Implementation

**Problem 1.1: Two Pointers + Heap - Attention Head Selector**
- **DSA Pattern:** Two Pointers + Min Heap
- **Paper Context:** Section 3.2 - Multi-Head Attention
- **Implementation:** `src/attention.py` - Selective Q-K pair computation
- **Real Usage:** Flash Attention optimization, sparse attention in GPT-4

**Problem 1.2: Dynamic Programming - Positional Encoding Optimization**
- **DSA Pattern:** Dynamic Programming (optimization)
- **Paper Context:** Section 3.5 - Positional Encoding
- **Implementation:** `src/embeddings.py` - Wavelength selection for sinusoidal encodings
- **Real Usage:** RoPE (Rotary Positional Embeddings) in Llama

#### Paper 2: Proximal Policy Optimization → PPO Implementation

**Problem 2.1: Sliding Window - Experience Buffer Sampling**
- **DSA Pattern:** Sliding Window + Weighted Average
- **Paper Context:** Section 3 - Generalized Advantage Estimation (GAE)
- **Implementation:** `src/buffer.py` - Trajectory processing with GAE(λ)
- **Real Usage:** InstructGPT training, ChatGPT RLHF pipeline

**Problem 2.2: Monotonic Stack - Trust Region Enforcement**
- **DSA Pattern:** Monotonic Stack
- **Paper Context:** Section 3.1 - Clipped Surrogate Objective
- **Implementation:** `src/ppo.py` - Finding valid policy update ranges
- **Real Usage:** Trust region without second-order optimization

---

### Theme 2: Foundations (4 problems)

#### Paper 3: InstructGPT → RLHF Implementation

**Problem 3.1: Priority Queue + Hash Map - Reward Model Training**
- **DSA Pattern:** Max Heap + Hash Map
- **Paper Context:** Section 3.2 - Reward Model Training
- **Implementation:** `src/reward_model.py` - Preference pair selection
- **Real Usage:** Anthropic's Constitutional AI, OpenAI's InstructGPT

**Problem 3.2: Graph (Topological Sort) - Training Pipeline Dependencies**
- **DSA Pattern:** Directed Acyclic Graph + Topological Sort
- **Paper Context:** Section 3 - Three-stage training pipeline
- **Implementation:** `src/pipeline.py` - SFT → RM → PPO dependency management
- **Real Usage:** Complex training pipelines in production LLMs

#### Paper 4: Constitutional AI → Self-Improvement Systems

**Problem 4.1: DFS/BFS - Self-Critique Chain Detection**
- **DSA Pattern:** Depth-First Search + Cycle Detection
- **Paper Context:** Section 2.1 - Critique → Revision chains
- **Implementation:** `src/constitution.py` - Principle violation traversal
- **Real Usage:** Claude's Constitutional AI, self-refinement loops

**Problem 4.2: Two Pointers - Harmlessness-Helpfulness Tradeoff**
- **DSA Pattern:** Two Pointers on sorted arrays
- **Paper Context:** Section 3.3 - Balancing objectives
- **Implementation:** `src/objectives.py` - Pareto frontier search
- **Real Usage:** Multi-objective optimization in AI safety

---

### Theme 3: Going Deeper (4 problems)

#### Paper 5: Specification Gaming Research → Reward Hacking Detection

**Problem 5.1: Interval Scheduling - Anomaly Detection Windows**
- **DSA Pattern:** Interval Scheduling + Greedy
- **Paper Context:** Section 2 - Temporal violation patterns
- **Implementation:** `src/detector.py` - Non-overlapping anomaly windows
- **Real Usage:** OpenAI's learned reward model monitoring

**Problem 5.2: Binary Search - Reward Threshold Tuning**
- **DSA Pattern:** Binary Search on answer space
- **Paper Context:** Section 4 - Optimal detection thresholds
- **Implementation:** `src/thresholds.py` - Precision-recall optimization
- **Real Usage:** Adversarial robustness in production systems

#### Paper 6: Red Teaming Research → Adversarial Prompt Detection

**Problem 6.1: Trie + DFS - Jailbreak Template Matching**
- **DSA Pattern:** Trie + Depth-First Search
- **Paper Context:** Section 3.1 - Pattern-based detection
- **Implementation:** `src/patterns.py` - Efficient template matching
- **Real Usage:** ChatGPT's moderation API, Claude's safety filters

**Problem 6.2: KMP Algorithm - Prompt Injection Detection**
- **DSA Pattern:** Knuth-Morris-Pratt string matching
- **Paper Context:** Section 3.2 - Substring injection attacks
- **Implementation:** `src/injection_detector.py` - Linear-time pattern search
- **Real Usage:** Production LLM safety layers

---

### Theme 4: Advanced Safety (4 problems)

#### Paper 7: Multi-Objective RLHF → Balancing Multiple Goals

**Problem 7.1: Merge Sort + Two Pointers - Pareto Optimal Solutions**
- **DSA Pattern:** Merge Sort + Two Pointers
- **Paper Context:** Section 2 - Multi-objective optimization
- **Implementation:** `src/pareto.py` - Non-dominated solution identification
- **Real Usage:** Balancing helpfulness, harmlessness, honesty

**Problem 7.2: Convex Hull - Objective Space Boundary**
- **DSA Pattern:** Graham Scan (Convex Hull)
- **Paper Context:** Section 3 - Feasible region analysis
- **Implementation:** `src/objectives.py` - Frontier computation
- **Real Usage:** Claude's multi-objective preference model

#### Paper 8: Safety Testing Framework → Systematic Evaluation

**Problem 8.1: Union-Find - Test Property Equivalence**
- **DSA Pattern:** Disjoint Set Union (Union-Find)
- **Paper Context:** Section 2.1 - Property clustering
- **Implementation:** `src/test_suite.py` - Equivalence class detection
- **Real Usage:** Anthropic's safety evaluations

**Problem 8.2: Reservoir Sampling - Unbiased Evaluation Sampling**
- **DSA Pattern:** Reservoir Sampling
- **Paper Context:** Section 3.2 - Statistical testing methodology
- **Implementation:** `src/sampling.py` - Representative test selection
- **Real Usage:** Large-scale model evaluation pipelines

---

### Theme 5: Interpretability (6 problems)

#### Paper 9: Activation Steering → Controlling Model Behavior

**Problem 9.1: Binary Search - Optimal Steering Direction**
- **DSA Pattern:** Binary Search + Linear Algebra
- **Paper Context:** Section 2 - Activation space navigation
- **Implementation:** `src/steering.py` - Direction magnitude optimization
- **Real Usage:** Anthropic's activation engineering research

**Problem 9.2: PCA/SVD - Principal Component Projection**
- **DSA Pattern:** Singular Value Decomposition (math/numpy)
- **Paper Context:** Section 3 - Dimensionality reduction
- **Implementation:** `src/projections.py` - Activation space compression
- **Real Usage:** Understanding high-dimensional representations

#### Paper 10: Transformer Circuits → Mechanistic Interpretability

**Problem 10.1: Graph Algorithms (SCC) - Circuit Detection**
- **DSA Pattern:** Strongly Connected Components (Tarjan's)
- **Paper Context:** Section 2.1 - Attention head circuits
- **Implementation:** `src/circuits.py` - Computational graph analysis
- **Implementation:** `src/circuits.py` - Computational graph analysis
- **Real Usage:** Anthropic's interpretability research, identifying induction heads

**Problem 10.2: Union-Find - Feature Attribution**
- **DSA Pattern:** Disjoint Set Union
- **Paper Context:** Section 3.2 - Connected neuron groups
- **Implementation:** `src/attribution.py` - Component clustering
- **Real Usage:** Understanding distributed representations

#### Paper 11: Neural Network Probes → Representation Analysis

**Problem 11.1: Linear Algebra - Maximum Margin Classifier**
- **DSA Pattern:** Linear Algebra (optimization)
- **Paper Context:** Section 2 - Linear probing methodology
- **Implementation:** `src/probes.py` - SVM-style classifier training
- **Real Usage:** Anthropic's research on model representations

**Problem 11.2: Cross-Validation - K-Fold Splitting Strategy**
- **DSA Pattern:** Array partitioning + rotation
- **Paper Context:** Section 3.1 - Probe evaluation methodology
- **Implementation:** `src/evaluation.py` - Stratified K-fold implementation
- **Real Usage:** Rigorous interpretability research methods

---

### Theme 6: Systems (4 problems)

#### Paper 12: KV Cache Systems → Efficient Inference

**Problem 12.1: LRU Cache - Key-Value Eviction**
- **DSA Pattern:** Hash Map + Doubly Linked List (LRU)
- **Paper Context:** Section 2 - Cache management strategies
- **Implementation:** `src/kv_cache.py` - Memory-efficient attention caching
- **Real Usage:** Production transformer inference (GPT-4, Claude)

**Problem 12.2: Segment Tree - Range-Based Memory Allocation**
- **DSA Pattern:** Segment Tree + Lazy Propagation
- **Paper Context:** Section 3 - Dynamic memory management
- **Implementation:** `src/memory.py` - Efficient batch allocation
- **Real Usage:** vLLM, TGI (Text Generation Inference) systems

#### Paper 13: Distributed Training → Scaling to Multiple GPUs

**Problem 13.1: Consistent Hashing - Load Balancing**
- **DSA Pattern:** Consistent Hashing
- **Paper Context:** Section 2.1 - Data parallel distribution
- **Implementation:** `src/distributed.py` - Even GPU workload distribution
- **Real Usage:** DeepSpeed, Megatron-LM training pipelines

**Problem 13.2: Gossip Protocol - Efficient Gradient Synchronization**
- **DSA Pattern:** Graph algorithms (spanning tree)
- **Paper Context:** Section 3 - All-reduce optimization
- **Implementation:** `src/sync.py` - Bandwidth-efficient gradient averaging
- **Real Usage:** Ring all-reduce in NCCL

---

### Theme 7: Integration (2 problems)

#### Paper 14: End-to-End Safety System → Putting It All Together

**Problem 14.1: Pipeline Design - Multi-Stage Safety Filtering**
- **DSA Pattern:** Pipeline pattern + topological ordering
- **Paper Context:** Integration section - Layered defense
- **Implementation:** `src/safety_pipeline.py` - Moderation → filtering → monitoring
- **Real Usage:** Production LLM safety stacks

**Problem 14.2: Circuit Breaker Pattern - System Failure Detection**
- **DSA Pattern:** State machine + sliding window
- **Paper Context:** Section 4 - Robust deployment
- **Implementation:** `src/monitoring.py` - Failure detection and graceful degradation
- **Real Usage:** Production inference systems

---

## guidance.yaml Structure (5 Categories)

Each problem includes a `guidance.yaml` file with 5 hint categories:

```yaml
title: "Two Pointers - Attention Head Selector"
pattern: "Two Pointers + Min Heap"

# Link to implementation project
project_mapping:
  primary: "mini-gpt-from-scratch"
  paper: "Attention is All You Need"
  paper_section: "3.2 - Multi-Head Attention"
  file: "src/attention.py"
  function: "compute_selective_attention"

hints:
  # Category 1: Standard DSA concepts
  key_concepts:
    - text: "Use two pointers to traverse sorted query and key arrays"
    - text: "Maintain a min-heap of size k to track top-k pairs"
    - text: "Sort pairs by similarity score: q·k dot product"
    - text: "Time complexity: O(n log k) vs O(n² log k) naive"

  # Category 2: Implementation pitfalls
  common_mistakes:
    - text: "⚠️ Don't compute all n² pairs - defeats the purpose"
    - text: "⚠️ Min-heap stores smallest k, but you want largest k scores"
    - text: "⚠️ Handle edge case: k > total possible pairs"

  # Category 3: Where this appears in YOUR implementations (NEW)
  project_context:
    - text: |
        🤖 Mini-GPT Attention Layer
        
        When you implement your transformer, full attention is O(n²):
        ```
        attention_scores = query @ key.T  # Computes ALL pairs
        ```
        
        This pattern lets you select only top-k pairs before computing
        attention, reducing to O(nk). This is how Flash Attention achieves
        3-5x speedup on long sequences.
        
        You'll implement this in `src/attention.py`:
        ```
        top_pairs = find_top_k_qk_pairs(q, k, k=32)
        sparse_attn = compute_attention(q, k, v, pairs=top_pairs)
        ```
        
    - text: |
        🤖 Real Numbers
        
        Mini-GPT with 512-token sequences:
        - Full attention: 512 × 512 = 262,144 Q-K pairs
        - Top-32 attention: 512 × 32 = 16,384 pairs
        - 16x fewer computations per head!
        
        With 12 attention heads: saves ~3M operations per forward pass

  # Category 4: Paper citations (NEW)
  paper_reference:
    - text: |
        📄 Flash Attention: Fast and Memory-Efficient Exact Attention
        Dao et al., 2022
        
        Section 3.2: "Block-Sparse Attention Selection"
        
        "We maintain the top-k query-key pairs using a priority queue
        during block-wise computation, reducing attention score
        calculations from O(n²) to O(nk)."
        
        Algorithm 2 (page 6) shows the implementation.
        
        [Read paper →] [Code reference →]

  # Category 5: Step-by-step solution (last resort)
  solution_approach:
    steps:
      - "Sort queries and keys by magnitude (preprocessing)"
      - "Initialize min-heap of size k"
      - "For each query q_i:"
      - "  Use two pointers to find keys with highest q·k scores"
      - "  Insert (score, q_idx, k_idx) into heap"
      - "  If heap.size > k: pop minimum"
      - "Return heap contents as top-k pairs"

complexity:
  time: "O(n log k)"
  space: "O(k)"
```

---

## Mobile-First UX Design

### Bottom Sheet Interaction (iOS Now Playing Style)

```
┌──────────────────────────────────────┐
│ ← Two Pointers - Attention Selector │
├──────────────────────────────────────┤
│                                      │
│    CODE EDITOR (FULL SCREEN)        │
│                                      │
│  def find_top_k_pairs(               │
│      queries: List[float],           │
│      keys: List[float],              │
│      k: int                          │
│  ) -> List[Tuple[int, int]]:        │
│      # Your code here                │
│      pass                            │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│  Tests: 2/5 ✓  [▶ Run Tests]        │
│  Need help? [Swipe up ▲]            │
└──────────────────────────────────────┘
```

**User swipes up → Bottom sheet appears:**

```
┌──────────────────────────────────────┐
│    CODE EDITOR (PARTIAL VIEW)        │
│  def find_top_k_pairs(               │
├══════════════════════════════════════┤ ← Drag handle
│  Choose a hint category:             │
│  ┌────────────────────────────────┐  │
│  │ › 💡 Key Concepts (4)          │  │
│  ├────────────────────────────────┤  │
│  │ › ⚠️  Common Mistakes (3)      │  │
│  ├────────────────────────────────┤  │
│  │ › 🤖 Project Context (2)       │  │
│  │   Mini-GPT attention layer     │  │
│  ├────────────────────────────────┤  │
│  │ › 📄 Paper Reference (1)       │  │
│  │   Flash Attention §3.2         │  │
│  ├────────────────────────────────┤  │
│  │ › 🎯 Solution Approach (1)     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**User taps "🤖 Project Context":**

```
┌──────────────────────────────────────┐
│  ˅ 🤖 Project Context (0/2 shown)    │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │ No hints revealed yet          │  │
│  │                                │  │
│  │ [Show First Hint]              │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  › 💡 Key Concepts (4)               │
│  › ⚠️  Common Mistakes (3)           │
│  › 📄 Paper Reference (1)            │
│  › 🎯 Solution Approach (1)          │
└──────────────────────────────────────┘
```

**User reveals first hint:**

```
┌──────────────────────────────────────┐
│  ˅ 🤖 Project Context (1/2)          │
│  ┌────────────────────────────────┐  │
│  │ 🤖 Mini-GPT Attention Layer    │  │
│  │ ────────────────────────────   │  │
│  │                                │  │
│  │ When you implement your        │  │
│  │ transformer, full attention    │  │
│  │ computes ALL query-key pairs   │  │
│  │ (O(n²) operations).            │  │
│  │                                │  │
│  │ This pattern teaches you to    │  │
│  │ select only top-k pairs,       │  │
│  │ reducing to O(nk).             │  │
│  │                                │  │
│  │ Flash Attention uses this for  │  │
│  │ 3-5x speedup!                  │  │
│  │                                │  │
│  │ [Show Next Hint]               │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│  › Other categories...               │
└──────────────────────────────────────┘
```

---

## Development Roadmap

### Week 1: MVP Core (5 problems)

**Goal:** Functional prototype with mobile-first UI

**Problems to create:**
1. Two Pointers - Attention Head Selector (Mini-GPT)
2. Sliding Window - Experience Buffer (PPO)
3. Dynamic Programming - Positional Encoding (Mini-GPT)
4. Monotonic Stack - Trust Region (PPO)
5. Priority Queue - Reward Model Pairs (RLHF)

**Features:**
- ✅ Next.js frontend with responsive design
- ✅ Monaco Editor (web) / CodeMirror (mobile)
- ✅ Bottom sheet hint system (iOS style)
- ✅ 5-category guidance system
- ✅ Local Docker execution (Python + PyTorch)
- ✅ Basic pass/fail test results
- ✅ Works great on mobile

**Time estimate:** 40-50 hours
- 5 problems × 3 hours each = 15 hours
- Frontend development = 15 hours
- Docker setup = 5 hours
- Testing & polish = 10 hours

---

### Month 1: Expand to 14 Problems (One Per Paper)

**Goal:** Cover all 14 papers with one problem each

**Additional problems:**
- Constitutional AI (DFS)
- Reward Hacking (Interval Scheduling)
- Adversarial Prompts (Trie)
- Multi-Objective RLHF (Merge Sort)
- Safety Testing (Union-Find)
- Activation Steering (Binary Search)
- Transformer Circuits (SCC)
- Neural Probes (Linear Algebra)
- KV Cache (LRU)
- Distributed Training (Consistent Hashing)
- End-to-End Safety (Pipeline)

**New features:**
- ✅ User accounts (simple email/password)
- ✅ Progress tracking (which problems solved)
- ✅ Problem filtering by paper/pattern
- ✅ Basic analytics (time to solve, hints used)

**Time estimate:** 30 hours
- 9 new problems × 3 hours = 27 hours
- Auth & progress tracking = 10 hours
- UI improvements = 8 hours

---

### Month 3: Complete Collection (28 Problems)

**Goal:** Two problems per paper, enhanced teaching

**Additional problems:**
- Second problem for each paper (14 more problems)
- Add `invariants.yaml` to 5 showcase problems
- Add `mistakes.yaml` to 5 showcase problems
- Richer visualizations for top problems

**New features:**
- ✅ Pattern collection tracking
- ✅ "Learn this pattern" recommendations
- ✅ Progress visualization (pattern mastery)
- ✅ Share solutions (public/private toggle)

**Time estimate:** 50 hours
- 14 new problems × 3 hours = 42 hours
- 5 problems enhanced (invariants + mistakes) × 2.5 hours = 12.5 hours
- New features = 15 hours

---

### Month 6: Production Ready

**Goal:** Deploy to cloud, add community features

**Infrastructure:**
- ✅ Deploy to Vercel (frontend)
- ✅ AWS ECS for Docker execution (backend)
- ✅ PostgreSQL for user data
- ✅ Redis for job queue
- ✅ S3 for code storage

**Features:**
- ✅ Social features (follow users, share solutions)
- ✅ Leaderboards (per problem, per pattern)
- ✅ Discussion threads per problem
- ✅ Code review feature
- ✅ Email notifications

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Code Editor:** Monaco (web), CodeMirror 6 (mobile)
- **State Management:** React Context + hooks
- **HTTP Client:** fetch (native)

### Backend
- **API:** Next.js API routes
- **Language:** TypeScript (Node.js)
- **Database:** PostgreSQL (future)
- **Cache:** Redis (future)
- **Job Queue:** BullMQ (future)

### Execution Environment
- **Container:** Docker
- **Base Image:** python:3.11-slim
- **Runtime:** Python 3.11
- **ML Framework:** PyTorch 2.0 (CPU)
- **Testing:** pytest
- **Timeout:** 10 seconds
- **Memory Limit:** 512MB

### DevOps
- **Version Control:** Git
- **Hosting:** Vercel (frontend), AWS ECS (executor)
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics (MVP)

---

## Key Implementation Details

### Code Execution Flow

```typescript
// frontend/lib/api.ts
export async function executeCode(problemId: string, code: string) {
  const response = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problemId, code })
  });
  
  return await response.json();
}
```

```typescript
// api/execute/route.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const { problemId, code } = await request.json();
  
  // Write code to temp file
  const tempFile = `/tmp/${Date.now()}.py`;
  await fs.writeFile(tempFile, code);
  
  // Execute in Docker
  const { stdout, stderr } = await execAsync(
    `docker run --rm ` +
    `-v ${tempFile}:/code/solution.py ` +
    `-v ./problems/${problemId}:/code/problem ` +
    `--memory=512m ` +
    `--cpus=1 ` +
    `--network=none ` +
    `cortex-executor python run_tests.py`
  );
  
  // Parse results
  const results = JSON.parse(stdout);
  
  return Response.json(results);
}
```

```python
# executor/run_tests.py
import sys
import yaml
from pathlib import Path

def run_tests(problem_dir: Path):
    # Load problem definition
    with open(problem_dir / 'problem.yaml') as f:
        problem = yaml.safe_load(f)
    
    # Import user solution
    sys.path.insert(0, '/code')
    from solution import *
    
    # Run test cases
    results = []
    for i, test in enumerate(problem['test_cases']):
        try:
            # Execute function
            fn = eval(problem['function_name'])
            output = fn(**test['input'])
            
            # Check result
            passed = output == test['expected']
            results.append({
                'test': i + 1,
                'passed': passed,
                'output': output,
                'expected': test['expected']
            })
        except Exception as e:
            results.append({
                'test': i + 1,
                'passed': False,
                'error': str(e)
            })
    
    # Return results as JSON
    print(json.dumps({
        'total': len(results),
        'passed': sum(r['passed'] for r in results),
        'results': results
    }))

if __name__ == '__main__':
    run_tests(Path('/code/problem'))
```

---

## Future Enhancements (Post-MVP)

### Phase 2: Enhanced Teaching (Month 2-3)
- ✅ Add `invariants.yaml` to problems
- ✅ Add `mistakes.yaml` for better feedback
- ✅ Detect common errors, provide specific guidance
- ✅ Show "This violates the X invariant" messages

### Phase 3: Interactive Learning (Month 4-6)
- ✅ Add `pause-points.yaml` for interactive debugging
- ✅ Step-through code execution
- ✅ "Predict next step" challenges
- ✅ Visual execution traces

### Phase 4: Community (Month 6+)
- ✅ User-generated problems
- ✅ Problem reviews and ratings
- ✅ Study groups
- ✅ Collaborative solving mode

### Phase 5: Advanced Features (Year 1+)
- ✅ AI tutor (GPT-4/Claude integration)
- ✅ Code review suggestions
- ✅ Personalized learning paths
- ✅ Certificate program

---

## Success Metrics

### Week 1 MVP
- ✅ 5 problems created with full guidance
- ✅ Mobile-responsive UI works smoothly
- ✅ Code execution returns results in <5 seconds
- ✅ 5 beta testers can solve at least 1 problem

### Month 1
- ✅ 14 problems (one per paper)
- ✅ 50+ test users
- ✅ 70% completion rate on attempted problems
- ✅ Average 3-4 hints used per solve

### Month 3
- ✅ 28 problems (complete collection)
- ✅ 500+ registered users
- ✅ 5,000+ problem attempts
- ✅ Users report learning the pattern transfer concept

### Month 6
- ✅ 1,000+ active users
- ✅ 80% solve rate after using hints
- ✅ Users successfully implement papers after solving problems
- ✅ First paying customers ($20/month tier)

---

## Getting Started (Developer Setup)

```bash
# Clone repository
git clone <repo-url>
cd cortex-lattice-mvp

# Install dependencies
npm install

# Set up Docker
docker build -t cortex-executor ./executor

# Create first problem content
mkdir -p problems/prerequisites/attention-is-all-you-need/two-pointers-attention-head-selector

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
DOCKER_IMAGE=cortex-executor
EXECUTION_TIMEOUT=10000
MAX_MEMORY=512m
```

---

## Contact & Resources

**Project Owner:** Jacob  
**Primary Goal:** Learn AI safety by building, create portfolio for FAANG/trading firms  
**Timeline:** Week 1 MVP → Month 6 launch  
**Business Model:** Worker-owned cooperative, $997/year individual pricing

**Key Papers:**
- Attention is All You Need (Vaswani et al., 2017)
- Proximal Policy Optimization (Schulman et al., 2017)
- Training language models to follow instructions with human feedback (Ouyang et al., 2022)
- Constitutional AI (Anthropic, 2022)
- Flash Attention (Dao et al., 2022)
- And 9 more...

---

**This document provides complete context for any developer (including Claude Code) to understand and contribute to Cortex Lattice MVP.**
