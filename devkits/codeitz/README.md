# Codeitz Agentic Software-Engineering System

Codeitz is a dedicated developer-kit application for autonomous software-engineering task orchestration, gated verification loops, and continuous self-learning.

## Overview

Codeitz provides an integrated SWE environment that combines:
- **Agentic SWE Engine**: Governs task intake, workspace grounding, minimal patch planning, automated execution, verification gates, and acceptance review.
- **Self-Learning Memory Bank**: Ingests task trajectories, diagnoses failure modes, extracts anti-patterns, and synthesizes weighted heuristics to prevent recurring errors.
- **Agent Skill Distiller**: Converts verified multi-step problem resolutions into standardized `SKILL.md` documents.
- **Interactive Web Desk**: A browser-based engineering dashboard built with `@codexsun/ui` for task tracking, memory inspection, and skill management.

## Architecture

Codeitz adheres to the standard CODEXSUN dual-host structure:
- `api`: `@codexsun/codeitz-api` running on port 6320. Exposes typed Fastify routes for SWE tasks, self-learning experiences, heuristics, and skills.
- `web`: `@codexsun/codeitz-web` running on port 6321. Provides the web workspace and MDI integration.

### Application Modules

1. **Foundation (`src/modules/foundation`)**:
   - Provider: `codeitz.foundation`
   - Purpose: Application lifecycle, health reporting, and platform runtime integration.
2. **Engineering (`src/modules/engineering`)**:
   - Provider: `codeitz.engineering`
   - Purpose: Phased SWE execution pipeline (`intake` → `grounding` → `planning` → `execution` → `verification` → `review` → `completed`).
3. **Learning (`src/modules/learning`)**:
   - Provider: `codeitz.learning`
   - Purpose: Episodic memory bank, failure root-cause analysis, heuristic synthesis, and keyword-based retrieval.
4. **Skills (`src/modules/skills`)**:
   - Provider: `codeitz.skills`
   - Purpose: Dynamic skill catalog, evaluation gates, and automatic distillation of markdown skills.

## Development Ports

| Service | Port | Dev Command | Health / Reference |
| --- | --- | --- | --- |
| Codeitz API | 6320 | `npm run dev:codeitz-api` | `http://127.0.0.1:6320/api/v1/codeitz/health` |
| Codeitz Web | 6321 | `npm run dev:codeitz-web` | `http://127.0.0.1:6321` |

## Local Setup

1. Verify environment configuration files:
   - Copy `devkits/codeitz/api/.app.env.example` to `devkits/codeitz/api/.app.env`.
   - Copy `devkits/codeitz/web/.app.env.example` to `devkits/codeitz/web/.app.env`.
2. Start the API host:
   ```bash
   npm run dev:codeitz-api
   ```
3. Start the Web host:
   ```bash
   npm run dev:codeitz-web
   ```

## Verification

Run test suites from the repository root:
```bash
npm.cmd run test:codeitz
```

Run architecture and boundary checks:
```bash
node tools/check-app-architecture.mjs
node tools/check-module-boundaries.mjs
```
