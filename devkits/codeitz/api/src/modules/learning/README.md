# Codeitz Learning Module

This module implements the self-learning memory bank, experience retrospective analyzer, and heuristic synthesizer for Codeitz.

## Architecture

The module enables continuous agent self-learning across coding sessions:
- Experience Bank: Ingests past task outcomes, symptoms, root causes, and resolutions.
- Retrospective Diagnosis: Extracts failure modes and translates them into actionable anti-pattern rules.
- Heuristic Synthesis: Generates weighted heuristics with trigger keywords, reinforcement counts, and effectiveness scores.
- Memory Querying: Supplies relevant past heuristics when framing new SWE tasks to prevent repeating mistakes.

## Components

- `contracts/learning-contracts.ts`: Zod schemas and TypeScript types defining experiences and heuristics.
- `repository/experience.repository.ts`: In-memory and persistent storage of experiences and learned heuristics.
- `service/self-learning.service.ts`: Core learning logic, keyword matching, and reinforcement scoring.
- `routes/learning.routes.ts`: Fastify HTTP endpoints exposing experience recording, heuristic matching, and reinforcement.
- `provider.ts`: Implements `ModuleProvider` and declares published and consumed event contracts.

## Verification

Run module tests using:
```bash
npx tsx --test src/modules/learning/test/learning.test.ts
```
