---
name: agentic-swe-pipeline
description: Autonomous software engineering loop for disciplined requirement decomposition, local code evidence grounding, minimal diff generation, verification, and regression prevention.
---

# Agentic Software-Engineering Pipeline

Execute software engineering tasks autonomously within strict repository boundaries, using verified code evidence, gated verification loops, and regression prevention.

## Purpose

Provide a deterministic, phase-based execution strategy for AI agents performing software engineering tasks in CODEXSUN.

## Scope

Applies to bug fixes, feature additions, refactoring, and module integrations within declared repository boundaries. Governs task intake, workspace grounding, minimal patch formulation, automated verification, and acceptance review.

## Inputs

- Task goal, requirements, and constraints from conversation or task register.
- Workspace root boundary (verified before running commands).
- Relevant files, module providers, contracts, and existing test suites.

## Phased Workflow

### Phase 1: Intake and Requirement Framing
1. Restate the requested outcome in one unambiguous sentence.
2. Identify non-negotiable boundaries, constraints, and platform contracts.
3. List explicit non-goals to avoid speculative expansion.

### Phase 2: Workspace Context Grounding
1. Locate relevant source files and tests using read-only search operations.
2. Verify existing test baseline before authoring changes.
3. Trace dependency trees and public contracts; never import private app internals across boundaries.

### Phase 3: Minimal Patch Planning and Execution
1. Draft minimal viable edits targeting only the owned application or package.
2. Keep edits focused and atomic; preserve comments, docstrings, and existing architecture conventions.
3. Avoid modifying shared lockfiles, build configurations, or dependencies unless explicitly requested.

### Phase 4: Guarded Verification Loop
1. Run local package typecheck (`tsc --noEmit` or equivalent).
2. Run local linters (`eslint`).
3. Execute unit and integration tests (`tsx --test` or `npm run test`).
4. Run boundary audits (`node tools/check-module-boundaries.mjs` and `node tools/check-app-architecture.mjs`).

### Phase 5: Autonomous Review and Handover
1. Compare before and after test results to prove zero regressions.
2. Verify all modified Markdown documents follow repository title and heading standards.
3. Summarize modifications, verified tests, and any remaining open items.

## Verification

Before marking any SWE task complete, verify:
- Current working directory is `E:\codexsun\codexsun`.
- All affected test commands exited code 0.
- No files outside the target ownership boundary were created or mutated.
- Zero untracked temporary files or debug logs remain.

## Exclusions

- Do not bypass verification gates or skip failing tests.
- Do not inspect, modify, or run commands outside the repository root.
- Do not commit secrets, tokens, private passwords, or private environment variables.
