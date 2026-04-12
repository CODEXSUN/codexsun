# Zetro End-To-End Creation Roadmap

This is the build checklist for turning Zetro from static terminal/dashboard catalog into a professional, auditable agent workspace.

Version line: `1.x`

Current baseline: `1.1.3`

Next target: `1.1.4`

## 1.0.0 Baseline: App Shell And Static Surface

Status: mostly complete.

Goal:

Create the Zetro app boundary and visible product surface.

Deliverables:

1. `apps/zetro` app scaffold.
2. Zetro app manifest.
3. Dashboard registration.
4. `@zetro` TypeScript and Vite aliases.
5. Static playbook catalog.
6. Static output modes.
7. Static guardrails.
8. Static sample runs and findings.
9. Dashboard pages.
10. Terminal command.
11. `ASSIST` docs.

Verification:

1. `npm.cmd run typecheck`
2. targeted ESLint
3. `npm.cmd run zetro -- doctor`
4. dashboard routes return 200

## 1.1.0 Persistence Foundation

Status: complete.

Goal:

Create the database foundation for Zetro-owned playbooks and runs.

Deliverables:

1. `apps/zetro/database/table-names.ts`
2. `apps/zetro/database/migration/01-zetro-playbooks.ts`
3. `apps/zetro/database/migration/02-zetro-runs.ts`
4. `apps/zetro/database/migration/03-zetro-findings.ts`
5. `apps/zetro/database/migration/04-zetro-guardrails.ts`
6. `apps/zetro/database/migration/05-zetro-settings.ts`
7. `apps/zetro/database/migration/index.ts`
8. `apps/zetro/database/seeder/01-zetro-defaults.ts`
9. `apps/zetro/database/seeder/index.ts`
10. registration through `apps/zetro/src/database-module.ts` if the framework pattern requires it

Tables:

1. `zetro_playbooks`
2. `zetro_playbook_phases`
3. `zetro_runs`
4. `zetro_run_events`
5. `zetro_findings`
6. `zetro_guardrails`
7. `zetro_settings`

Exit criteria:

1. Migrations compile.
2. Seeders compile.
3. Zetro default playbooks can be represented in database rows.
4. No dashboard behavior changes yet.

Verification:

```powershell
npm.cmd run typecheck
npm.cmd run db:status
```

Completion notes:

1. Zetro table names exist.
2. Five Zetro migrations are registered.
3. One Zetro defaults seeder is registered.
4. No dashboard behavior was changed in this milestone.

## 1.1.1 Zetro Store And Services

Status: complete.

Goal:

Add app-owned data access and business logic for persisted catalog data.

Deliverables:

1. `apps/zetro/src/data/query-database.ts`
2. `apps/zetro/src/services/playbook-service.ts`
3. `apps/zetro/src/services/run-service.ts`
4. `apps/zetro/src/services/finding-service.ts`
5. `apps/zetro/src/services/guardrail-service.ts`
6. `apps/zetro/src/services/settings-service.ts`
7. `apps/zetro/src/services/zetro-summary-service.ts`

Service behavior:

1. List playbooks.
2. Read playbook with phases.
3. List runs.
4. Read run with events and findings.
5. List findings.
6. Update finding status.
7. List guardrails.
8. Read settings.
9. Produce dashboard summary.

Exit criteria:

1. Services read seeded data.
2. Static catalog remains as fallback or seeder source only.
3. No transport route code leaks business logic.

Verification:

```powershell
npm.cmd run typecheck
npx.cmd eslint apps\zetro\src\services\*.ts apps\zetro\src\data\*.ts
```

Completion notes:

1. Zetro store helpers exist.
2. Playbook, run, finding, guardrail, settings, and summary services exist.
3. Services read seeded records from the Zetro JSON-store tables.
4. Finding status updates are implemented through the Zetro store.
5. Dashboard and terminal integration remain deferred to `1.1.3` and `1.1.4`.

## 1.1.2 Internal API Routes

Status: complete.

Goal:

Expose Zetro persisted data through protected internal routes.

Deliverables:

1. route registration in `apps/api`
2. `GET /internal/v1/zetro/summary`
3. `GET /internal/v1/zetro/playbooks`
4. `GET /internal/v1/zetro/playbook?id=<playbookId>`
5. `GET /internal/v1/zetro/runs`
6. `GET /internal/v1/zetro/run?id=<runId>`
7. `POST /internal/v1/zetro/runs`
8. `POST /internal/v1/zetro/run/events?id=<runId>`
9. `GET /internal/v1/zetro/findings`
10. `PATCH /internal/v1/zetro/finding?id=<findingId>`
11. `GET /internal/v1/zetro/guardrails`
12. `GET /internal/v1/zetro/settings`

Exit criteria:

1. Routes use Zetro services.
2. Routes enforce existing session/auth rules.
3. Routes return stable JSON contracts.
4. Routes do not execute commands.

Verification:

```powershell
npm.cmd run typecheck
npm.cmd run test -- tests/api/internal/routes.test.ts
```

Completion notes:

1. Zetro internal routes exist in `apps/api/src/internal/zetro-routes.ts`.
2. Routes use Zetro services and `requireAuthenticatedUser`.
3. Routes follow the existing exact-path plus query-id convention.
4. Manual run and run-event create routes persist records only and do not execute commands.
5. Focused Zetro route tests verify route registration and authenticated persisted reads.

## 1.1.3 Dashboard API Integration

Status: complete.

Goal:

Replace static dashboard reads with API-backed reads.

Deliverables:

1. `apps/zetro/web/src/api/zetro-api.ts`
2. query keys in the app web layer or existing query key registry
3. overview page reads `summary`
4. playbooks page reads `playbooks`
5. runs page reads `runs`
6. findings page reads `findings`
7. guardrails page reads `guardrails`
8. settings page reads `settings`
9. loading and error states

Exit criteria:

1. Dashboard still works with seeded data.
2. Static data is no longer the primary UI source.
3. No execution behavior exists.

Verification:

```powershell
npm.cmd run typecheck
npx.cmd eslint apps\zetro\web\src
```

Completion notes:

1. Zetro web API client exists in `apps/zetro/web/src/api/zetro-api.ts`.
2. Overview, playbooks, runs, findings, guardrails, and settings pages read internal API data.
3. Dashboard pages show loading and error states through the Zetro page shell.
4. Static data remains the seeder/source catalog, not the primary dashboard source.

Manual routes:

1. `/dashboard/apps/zetro`
2. `/dashboard/apps/zetro/playbooks`
3. `/dashboard/apps/zetro/runs`
4. `/dashboard/apps/zetro/findings`
5. `/dashboard/apps/zetro/guardrails`
6. `/dashboard/apps/zetro/settings`

## 1.1.4 Terminal Persistence Integration

Goal:

Make the terminal read persisted playbooks and runs when the database is available.

Deliverables:

1. terminal data loader
2. `npm.cmd run zetro -- status` reads persisted summary
3. `npm.cmd run zetro -- playbooks` reads persisted playbooks
4. `npm.cmd run zetro -- playbook <id>` reads persisted phases
5. `npm.cmd run zetro -- doctor` checks database-backed catalog when available
6. safe fallback to static catalog if database is unavailable

Exit criteria:

1. Terminal remains side-effect free.
2. Terminal can run without dev server.
3. Terminal reports whether it used database or static fallback.

Verification:

```powershell
npm.cmd run zetro -- status
npm.cmd run zetro -- playbooks
npm.cmd run zetro -- doctor
npm.cmd run typecheck
```

## 1.2.0 Manual Run Console

Goal:

Create real manual Zetro runs with event logs and findings.

Deliverables:

1. create run UI
2. create run terminal command
3. add run event UI
4. add run event terminal command
5. create finding UI
6. update finding status UI
7. run detail page
8. event timeline
9. no command execution

Exit criteria:

1. Operator can create a run.
2. Operator can add notes/events.
3. Operator can add findings.
4. Operator can reload the run.
5. Everything is persisted.

Verification:

```powershell
npm.cmd run typecheck
npm.cmd run zetro -- runs
```

## 1.2.1 Run Output Sections

Goal:

Store and render maximum-output sections for a run.

Deliverables:

1. run output section model
2. output mode selector
3. maximum output template
4. audit output template
5. dashboard renderer
6. terminal renderer

Exit criteria:

1. Run can store structured output.
2. Terminal can print structured output.
3. Dashboard can render structured output.

## 1.3.0 Advisory Command Proposals

Goal:

Let Zetro propose commands without executing them.

Deliverables:

1. command proposal table or run event metadata
2. command proposal UI
3. command proposal terminal output
4. approval state
5. rejection state
6. runner policy service

Exit criteria:

1. Zetro proposes commands.
2. Operator can approve or reject.
3. No command is executed.

## 1.3.1 Runner Policy And Allowlist

Goal:

Define what can ever be run later.

Deliverables:

1. allowlist settings
2. blocked command categories
3. sensitive command guardrails
4. approval rules
5. timeout defaults
6. cancellation model

Exit criteria:

1. Policy can reject unsafe proposals.
2. Policy can explain why a command is blocked.

## 1.4.0 Approved CLI Runner

Goal:

Execute allowlisted commands after approval.

Deliverables:

1. CLI bridge
2. approval check
3. stdout capture
4. stderr capture
5. exit code capture
6. timeout
7. cancellation
8. run event persistence

Exit criteria:

1. Every command has approval.
2. Every command has output capture.
3. Every command has exit code.
4. Every command is visible in the run timeline.

## 1.5.0 Model Provider Adapter

Goal:

Connect a model provider in a controlled, configurable way.

Deliverables:

1. provider registry for `none`, `ollama-local`, `openai`, `anthropic`, and `custom-openai-compatible`
2. provider adapter interface
3. disabled-by-default provider config
4. environment-backed provider settings
5. output mode prompt sections
6. response persistence
7. token/cost metadata where available
8. provider health check
9. prompt builder
10. model output guardrail that blocks direct writes or command execution

Exit criteria:

1. Model can be disabled.
2. Model output persists.
3. Ollama can be used locally when configured.
4. Hosted providers are opt-in only.
5. No model output writes files or executes commands.

## 1.5.1 Terminal Agent Mode

Goal:

Make `npm.cmd run zetro -- chat` model-backed when enabled.

Deliverables:

1. session persistence
2. source summary
3. prompt assembly
4. model response stream or complete response
5. output mode selector
6. audit events
7. `npm.cmd run zetro -- chat --provider ollama-local`
8. `npm.cmd run zetro -- plan "<request>" --model`

Exit criteria:

1. Chat works without command execution.
2. Chat stores the response.
3. Chat can be disabled by provider settings.

## 1.5.2 Maximum Output Engine

Goal:

Use Zetro playbooks and output modes to make model output structured, auditable, and useful for implementation.

Deliverables:

1. output mode prompt builder
2. maximum-output section template
3. audit-output section template
4. repo-context packer
5. finding parser
6. command proposal parser
7. cost/token log where the provider supports it
8. response-to-run-event persistence

Exit criteria:

1. Model output follows the selected Zetro output mode.
2. Findings can be parsed into structured finding drafts.
3. Command proposals remain proposals until a later approval-gated runner milestone.

## 1.6.0 Review Automation

Goal:

Create structured review findings from Zetro review playbooks.

Deliverables:

1. review lane model
2. finding parser
3. severity and confidence mapping
4. dashboard finding workflow
5. terminal finding output
6. optional Task follow-up creation

Exit criteria:

1. Findings are structured.
2. Findings can be accepted, dismissed, fixed, or moved to Task.

## 1.7.0 Controlled Loop

Goal:

Allow bounded iterative workflows.

Deliverables:

1. max iterations
2. hard timeout
3. visible cancel
4. stop condition
5. event log per iteration
6. admin-only enablement
7. dry-run mode

Exit criteria:

1. No unbounded loop is possible.
2. Operator can stop immediately.
3. Every iteration is auditable.

## Build Rule

Build one milestone at a time.

Do not move to command execution before persistence, approval, and audit are complete.
