# Codeitz Engineering Module

This module implements the autonomous agentic software-engineering orchestrator and task lifecycle for Codeitz.

## Architecture

The module governs disciplined agentic engineering through deterministic lifecycle phases:
- `intake`: Parse problem statement, requirements, and constraints.
- `grounding`: Search workspace files, inspect symbols, and locate tests without speculative modification.
- `planning`: Frame minimal viable patches and list expected invariants.
- `execution`: Draft and stage code edits within owner boundaries.
- `verification`: Run typechecks, linters, unit tests, and contract audits.
- `review`: Validate acceptance criteria and guard against regressions.
- `completed` or `failed`: Terminal resolution states.

## Components

- `contracts/swe-contracts.ts`: Zod schemas and TypeScript types defining tasks, phases, and verification checks.
- `repository/swe-task.repository.ts`: Repository managing in-memory or persisted task states and trajectories.
- `service/swe-orchestrator.service.ts`: Core orchestrator validating phase order and gating transitions with verification checks.
- `routes/swe.routes.ts`: Fastify HTTP endpoints exposing SWE task workflows.
- `provider.ts`: Implements `ModuleProvider` and declares published and consumed event contracts.

## Verification

Run module tests using:
```bash
npx tsx --test src/modules/engineering/test/engineering.test.ts
```
