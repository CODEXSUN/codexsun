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
