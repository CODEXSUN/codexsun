# Codeitz Agentic Software-Engineering Architecture

Describes the end-to-end design, phase execution model, verification gates, and event interfaces of Codeitz.

## Architectural Overview

Codeitz operates as an autonomous agentic software-engineering orchestrator. Rather than issuing unconstrained edits, the system enforces a deterministic, phase-driven execution model where every transition requires verifiable artifacts.

```text
[ SWE Task Intake ]
        │
        ▼
[ Workspace Grounding ] ──> Locate source, read-only tests, contracts
        │
        ▼
[ Minimal Patch Plan ]   ──> Outline exact files, invariants, non-goals
        │
        ▼
[ Gated Execution ]      ──> Atomic edits within application boundaries
        │
        ▼
[ Automated Verification ] ──> Typecheck, lint, unit tests, boundary audits
        │
        ▼
[ Acceptance Review ]    ──> Regression check, doc standards, approval
        │
        ▼
[ Continuous Learning ]  ──> Trajectory retrospective & heuristic synthesis
```

## Core Principles

### 1. Evidence-Based Grounding
Before modifying any file, the agent locates and inspects relevant source code, provider manifests, and test fixtures. Speculative code generation without repository ground-truth is rejected.

### 2. Gated Verification Loops
Transitions to the `completed` phase require passing verification checks (typechecks, linters, unit tests). A task with failing checks is placed in `rejected` status and cannot be finalized until root causes are diagnosed and resolved.

### 3. Boundary Containment
Edits must stay strictly within the target application or devkit (`devkits/codeitz/`). Cross-application imports and unauthorized root package alterations are blocked.

### 4. Self-Learning Loop Integration
Upon task completion or failure, the trajectory is transmitted to the `learning` module. The system analyzes errors, extracts anti-patterns, updates effectiveness scores, and produces reusable heuristics.

### 5. Multi-Modal & Engineering Capabilities Suite
The capabilities module exposes 10 automated tools:
- Real-time prompt spelling and typo correction.
- Grounded web search across MDN, GitHub, and RFC documentation.
- Headless and interactive browser automation.
- Computer vision for inspecting UI screenshots, layouts, and OCR text.
- Generative SVG architecture diagrams and mockups.
- Native Text-to-Speech (TTS) audio narration.
- Multi-model reasoning across Gemini, Claude, GPT, DeepSeek, and consensus synthesis.
- Sandboxed operating system computer-use automation.
- Excel and spreadsheet tabular metric parsing.
- Technical PDF specification parsing.

### 6. Codebase Knowledge Graph Mapping
For large projects, Codeitz indexes monorepo packages, modules, exports, and `@codexsun/*` dependency links, verifying clean DAG topologies (zero circular dependencies) and assisting agents in rapid structural grounding.

### 7. Git Change Management & Sensible Commits
Tracks working tree state, displays unified diff chunks, automatically produces conventional commits (`type(scope): message` with verified test gates), and provides one-click AI change rollback (`git restore .`).
