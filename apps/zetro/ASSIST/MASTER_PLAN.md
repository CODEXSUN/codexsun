# Zetro Master Plan

## One-Line Goal

Build Zetro into a terminal-first, dashboard-backed agent workspace for planning, reviewing, and safely executing Codexsun work.

## What Exists Now

1. `apps/zetro` app scaffold.
2. Dashboard route at `/dashboard/apps/zetro`.
3. Static playbook catalog.
4. Static output modes.
5. Static guardrails.
6. Static sample runs and findings.
7. Persisted playbooks, runs, findings, guardrails, settings.
8. Advisory command proposals with approval workflow.
9. Approved CLI runner with allowlist and policy validation.
10. Model provider adapters (none, ollama-local, openai, anthropic).
11. Interactive shell with chat sessions.
12. Review lanes (8 structured categories) with severity/confidence mapping.
13. Review dashboard and terminal commands.
14. Controlled loop service with max iterations, timeout, stop conditions, and iteration events.
15. Loop terminal commands (loop, loop-start, loop-stop, loop-cancel, loop-events).
16. Loop control panel in dashboard runs page.
17. **Phase 2.1**: Semantic memory layer with vector embeddings (Ollama/TF-IDF fallback).
18. Memory commands and dashboard page.
19. **Phase 2.2**: Smart playbooks with conditional logic (skipIf, requireIf, gotoIf, retry).
20. **Phase 2.3**: Multi-model task router with task classification and routing map.
21. **Phase 2.4**: Agent role specialization (planner, executor, reviewer agents).
22. Terminal command: `npm.cmd run zetro -- ...`.
23. Interactive shell: `npm.cmd run zetro -- chat`.

## Phase Order

Do not skip phases.

Detailed milestone checklist lives in `END_TO_END_CREATION.md`.

1. Static product surface.
2. Persisted playbooks and runs.
3. Internal API.
4. Manual run console.
5. Advisory command proposals.
6. Approved CLI runner.
7. Model provider.
8. Controlled loop.

## Phase 1: Static Product Surface

Status: in progress.

Goal:

Make the product shape obvious before persistence or automation.

Includes:

1. Dashboard pages for overview, playbooks, runs, findings, guardrails, settings.
2. Terminal commands for summary, playbooks, output modes, guardrails, runs, findings, and plan scaffold.
3. Human-readable Assist docs.

Done when:

1. Typecheck passes.
2. Targeted lint passes.
3. Dashboard routes return 200.
4. Terminal commands work.

## Phase 2: Persistence

Goal:

Move static catalog into app-owned database tables.

Build:

1. `database/table-names.ts`
2. migrations for playbooks, phases, runs, events, findings, guardrails, settings
3. seeders for the initial catalog
4. services under `apps/zetro/src/services`

Done when:

1. `db:migrate` works.
2. `db:seed` installs Zetro defaults.
3. Zetro can read persisted playbooks without static-only data.

## Phase 3: Internal API

Goal:

Expose Zetro data through internal protected API routes.

Build:

1. summary route
2. playbook routes
3. run routes
4. finding routes
5. guardrail routes
6. settings routes

Done when:

1. Dashboard reads API-backed data.
2. API tests cover happy path and auth denial.

## Phase 4: Manual Run Console

Goal:

Create and inspect runs without executing commands.

Build:

1. create run
2. add run event
3. add finding
4. update finding status
5. show timeline

Done when:

1. A run can be created and reloaded.
2. The event log is persisted.
3. Findings are persisted.

## Phase 5: Advisory Runner

Goal:

Zetro proposes commands but does not execute them.

Build:

1. command proposal model
2. approval state
3. allowlist settings
4. runner policy service

Done when:

1. Operator can approve or reject a proposed command.
2. No shell command is executed yet.

## Phase 6: Approved CLI Runner

Goal:

Execute only allowlisted commands after approval.

Build:

1. narrow CLI bridge
2. stdout capture
3. stderr capture
4. exit code capture
5. timeout
6. cancellation

Done when:

1. Every command has an approval record.
2. Every result is stored as a run event.

## Phase 7: Model Provider

Goal:

Connect Zetro to a configurable model provider.

Build:

1. provider settings
2. prompt assembly
3. max output profiles
4. response persistence
5. cost and token controls

Done when:

1. A model response can be generated and persisted.
2. The provider can be disabled without breaking Zetro.

## Phase 8: Controlled Loop

Goal:

Allow iterative work only with hard safety rails.

Build:

1. max iterations
2. hard timeout
3. visible cancel
4. stop condition
5. full event log

Done when:

1. No unbounded loop is possible.
2. Every iteration is auditable.
