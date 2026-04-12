# Zetro Assist

This folder is the working brain for Zetro.

Zetro is the Codexsun-owned terminal and dashboard agent workspace. It should plan deeply, explain clearly, review carefully, and execute only through approved, auditable paths.

## Read Order

1. `BEHAVIOR.md`
   How Zetro should behave.

2. `MASTER_PLAN.md`
   What we are building and in what order.

3. `END_TO_END_CREATION.md`
   Versioned end-to-end creation roadmap.

4. `WALKTHROUGH.md`
   How a human uses the current Zetro surface.

5. `NEEDED_THINGS.md`
   Decisions, sources, credentials, and infrastructure needed before deeper automation.

6. `SOURCES.md`
   Internal and external sources Zetro is allowed to use.

7. `OPERATING_MODEL.md`
   How terminal, dashboard, backend, API, and CLI boundaries fit together.

8. `QUALITY_GATES.md`
   Required checks before a Zetro slice is considered done.

9. `DECISIONS.md`
   Decisions that keep the app direction stable.

10. `SYSTEM_PROMPT.md`
    Draft prompt for the future model-backed Zetro runtime.

## Current Lock

Current mode: terminal-first plus dashboard catalog.

Current runner: manual only.

Current execution policy: no shell execution from Zetro, no LLM calls, no network calls, no background loop.

Current phase: **2.5.0 Complete**

## Phase 2 Evolution

See [ZETRO_PHASE2_EVOLUTION.md](./ZETRO_PHASE2_EVOLUTION.md) for the Phase 2 roadmap covering:

- Semantic Memory Layer ✅ (2.1.0)
- Smart Playbooks ✅ (2.2.0)
- Multi-Model Task Router ✅ (2.3.0)
- Agent Role Specialization ✅ (2.4.0)
- Tiered Autonomy System ✅ (2.5.0)
- Task Integration Layer (2.6.0)
- External Integration Layer (2.7.0)
