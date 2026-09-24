---
name: swe-self-learning
description: Continuous self-learning system for software engineering agents to diagnose root causes, extract reusable heuristics, record post-mortems, and adapt execution strategies.
---

# Software-Engineering Self-Learning System

Diagnose engineering outcomes, extract reusable patterns and anti-patterns, and adapt future problem-solving strategies through systematic retrospectives.

## Purpose

Enable software-engineering agents to learn from both successes and failures, crystallizing episodic task experiences into persistent rules, guardrails, and heuristics.

## Scope

Used during and immediately after software engineering task execution. Ingests execution trajectories, compiler/linter error messages, test failure assertions, and successful fixes to update memory banks and heuristic models.

## Inputs

- Task goal, initial prompt, and execution trajectory.
- Errors, warnings, and unexpected failure symptoms encountered.
- Verified resolution steps and root cause findings.
- Effectiveness feedback from automated test suites.

## Workflow

### 1. Trajectory Ingestion
- Capture the failure or success event immediately upon occurrence.
- Record the exact symptom (e.g. `TypeError: Cannot read properties of undefined`, `AssertionError: The input did not match regular expression`).
- Record the technical domain (e.g. `api-routing`, `typecheck`, `db-migration`, `ui-layout`).

### 2. Root Cause Retrospective Analysis
- Distinguish proximate causes (e.g., test failure) from root causes (e.g., lifecycle sequence mismatch, missing environment variable).
- Identify which assumptions failed and what context was overlooked.
- Formulate the contrast: "What was expected vs. what actually occurred."

### 3. Heuristic and Anti-Pattern Synthesis
- Transform the root cause and resolution into an actionable rule:
  - If a mistake occurred, synthesize an **Anti-Pattern Rule** describing what to avoid and the correct counter-action.
  - If a novel solution worked, synthesize a **Strategy Rule** with trigger keywords and preconditions.
  - If a critical invariant was violated, synthesize a **Guardrail Rule** with mandatory checklist items.

### 4. Memory Bank Indexing
- Tag the synthesized rule with trigger keywords (e.g., `#migration`, `#routing`, `#boundary`).
- Assign an initial effectiveness score (0.75-0.85).
- Store the experience in the Codeitz learning memory bank.

### 5. Forward Adaptation
- Query matching heuristics before commencing any future SWE task matching the domain or keywords.
- Review and apply learned heuristics during the Planning and Verification phases.

## Verification

Before persisting a learned heuristic, verify:
- The rule is generalizable and not a brittle one-off workaround.
- The rule does not contradict repository rules or platform standards.
- The resolution was verified by automated tests exiting code 0.

## Exclusions

- Do not synthesize heuristics from unverified or speculative fixes.
- Do not record credentials, private tokens, or proprietary customer data in learned memory banks.
