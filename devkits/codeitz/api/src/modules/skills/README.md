# Codeitz Skills Module

This module implements the dynamic skill registry, evaluation harness, and automatic skill distillation engine for Codeitz.

## Architecture

The module formalizes repeatable problem-solving patterns into standardized Agent Skills:
- Registry: Indexes both pre-configured baseline skills and dynamically synthesized skills.
- Distillation Engine: Transforms verified multi-step resolutions into canonical `SKILL.md` documents containing YAML frontmatter, purpose, inputs, step-by-step workflow, verification rules, guardrails, and explicit exclusions.
- Discovery API: Allows SWE agents and humans to browse, retrieve, and execute specialized skills.

## Components

- `contracts/skills-contracts.ts`: Zod schemas and TypeScript types defining skill definitions and distillation requests.
- `repository/skill.repository.ts`: In-memory and persistent storage of registered skills.
- `service/skill-distiller.service.ts`: Core distillation logic formatting markdown and seeding baselines.
- `routes/skills.routes.ts`: Fastify HTTP endpoints exposing skill retrieval and distillation.
- `provider.ts`: Implements `ModuleProvider` and declares published and consumed event contracts.

## Verification

Run module tests using:
```bash
npx tsx --test src/modules/skills/test/skills.test.ts
```
