# Codeitz Self-Learning System Specification

Specifies the retrospective analysis engine, pattern synthesis, heuristic memory indexing, and reinforcement mechanics of Codeitz.

## Purpose

Define how Codeitz captures episodic engineering experiences and systematically distills them into persistent heuristics, anti-patterns, and formal agent skills.

## Self-Learning Pipeline

### 1. Episodic Trajectory Capture
Every engineering run records:
- `taskId`: Unique task identifier.
- `outcome`: `success`, `failure`, or `partial`.
- `domain`: Architectural domain (e.g., `api-routing`, `database-migration`, `ui-layout`, `authentication`).
- `symptoms`: Exact error messages, stack traces, and compiler diagnostics.
- `rootCause`: Underlying rationale for the failure.
- `resolution`: Concrete corrective actions verified by passing tests.

### 2. Pattern Extraction & Classification
The learning service categorizes synthesized insights into four canonical buckets:
- **Guardrails**: Hard invariants and pre-execution checks (e.g., repository root verification, title heading checks).
- **Strategies**: Recommended implementation tactics that previously succeeded in similar domains.
- **Patterns**: Structural conventions (e.g., paired repository and service layers).
- **Anti-Patterns**: Traps, bad assumptions, or failure-prone behaviors to explicitly avoid.

### 3. Heuristic Scoring & Reinforcement
Each heuristic maintains:
- `reinforcementCount`: Number of times the rule was triggered or applied.
- `effectivenessScore`: Normalized float `[0.1, 1.0]`. Helpful applications increase the score (+0.05), while ineffective applications reduce the score (-0.10).

### 4. Retrieval and Dynamic Context Injection
When an agent receives a new prompt:
1. The prompt and target domain are tokenized and scored against the heuristic index.
2. High-confidence heuristics (score ≥ 0.90) and keyword matches are returned.
3. The agent incorporates these rules during the Grounding and Planning phases, preventing regression.

### 5. Skill Distillation
When a pattern recurs across multiple engineering sessions with high effectiveness, the `skills` module automatically formats the workflow into a permanent `SKILL.md` specification with YAML frontmatter.
