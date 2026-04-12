# Zetro End-To-End Creation Roadmap

This is the build checklist for turning Zetro from static terminal/dashboard catalog into a professional, auditable agent workspace.

Version line: `1.x`

Current baseline: `1.6.0`

Next target: `1.7.0`

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

Status: complete.

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

Completion notes:

1. Terminal data loader exists in `apps/zetro/src/terminal-data.ts`.
2. Terminal commands read persisted Zetro playbooks, phases, runs, findings, guardrails, settings, and summary when the database is available.
3. Terminal commands fall back to static catalog data if database access fails.
4. Terminal output reports whether it used `database` or `static` data.
5. Terminal remains side-effect free except for preparing migrations/seeders before reads.

## 1.2.0 Manual Run Console

Status: complete.

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

Completion notes:

1. Runs page can create a manual run.
2. Runs page can open a run detail panel.
3. Runs page can append manual run events.
4. Runs page renders the event timeline and linked findings.
5. Findings page can create a manual finding.
6. Findings page can update finding status.
7. Terminal can create runs, append events, create findings, update finding status, and read run details.
8. No command execution was added.

## 1.2.1 Run Output Sections

Status: complete.

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

Completion notes:

1. `zetro_run_output_sections` table exists with migration `06-zetro-run-output-sections`.
2. Output section service exists with create and replace operations.
3. Runs page shows output sections with section selector and content textarea.
4. Terminal `output <runId>` command prints structured output sections.
5. Dashboard renders output sections with sequence, section name, content, and timestamp.
6. No command execution was added.

## 1.3.0 Advisory Command Proposals

Status: complete.

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

Completion notes:

1. `zetro_command_proposals` table exists with migration `07-zetro-command-proposals`.
2. Command proposal service exists with create, list, and status update operations.
3. Proposals are linked to runs and track command, args, summary, rationale, status, reviewedAt, reviewedBy.
4. Dashboard runs page shows command proposals with approve/reject buttons for pending proposals.
5. Terminal commands: `proposals [--run <id>]`, `propose --run <id> --cmd <v> --summary <v>`, `approve <proposalId>`, `reject <proposalId>`.
6. No command execution was added. Proposals stay pending until explicitly approved.

## 1.3.1 Runner Policy And Allowlist

Status: complete.

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

Completion notes:

1. `zetro_command_allowlist` table exists with migration `08-zetro-command-allowlist`.
2. Allowlist service exists with list, create, and policy check operations.
3. Default allowlist entries for npm, tsc, npx, git are seeded.
4. Built-in blocked commands: sudo, su, chmod, chown, chgrp.
5. Built-in sensitive commands: rm, rmdir, del, format, shutdown, reboot, halt, init, mkfs, dd, fdisk.
6. Command proposals are validated against the policy before creation.
7. Blocked commands throw an error. Commands not in allowlist throw an error.
8. Policy settings: allowAll, requireApproval, maxTimeoutSeconds, auditAllCommands.
9. API routes exist for allowlist entries, blocked patterns, and policy settings.

## 1.4.0 Approved CLI Runner

Status: complete.

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

Completion notes:

1. `zetro_executed_commands` table exists with migration `09-zetro-executed-commands`.
2. Runner service with CLI bridge, approval check, stdout/stderr/exit code capture.
3. Timeout support with configurable duration (default 300s).
4. Cancellation support via SIGTERM.
5. Commands are persisted with full output, status, and timing.
6. API routes: `POST /zetro/execute` for direct execution, `POST /zetro/execute/proposal` for approve-and-execute.
7. API route: `GET /zetro/executed` for listing executed commands.
8. All execution passes through policy validation.

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

Status: complete.

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

Completion notes:

1. Model provider types exist in `model-provider-types.ts`.
2. Provider adapters for none, ollama-local, openai, anthropic, custom-openai-compatible exist in `model-provider-adapters.ts`.
3. Model provider service with health check exists in `model-provider-service.ts`.
4. Environment-backed configuration via `ZETRO_PROVIDER`, `ZETRO_*_API_KEY`, `ZETRO_*_BASE_URL`, `ZETRO_*_MODEL` env vars.
5. Provider settings default to "none" (disabled).
6. Token/cost metadata captured in model responses.
7. Health check API route: `GET /zetro/provider/health`.
8. Provider list API route: `GET /zetro/providers`.
9. No model output writes files or executes commands.

## 1.5.1 Terminal Agent Mode

Status: complete.

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

Completion notes:

1. `zetro_chat_sessions` and `zetro_chat_messages` tables exist with migration `10-zetro-chat`.
2. Chat service with session and message persistence.
3. Prompt builder with output mode templates (brief, normal, detailed, maximum, audit).
4. Safety guardrail in system prompt blocks direct file writes and command execution.
5. Terminal chat supports `--provider` and `--mode` flags.
6. Chat history is built from user messages.
7. Provider health check runs on chat start.
8. No command execution from model output.

## 1.5.2 Maximum Output Engine

Status: complete.

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

Completion notes:

1. Enhanced prompt builder with `ZetroRepoContext` for repository context packing.
2. Added `parseCommandProposals()` function to extract commands from model output.
3. Added `parseFindings()` function to extract structured findings from model output.
4. Added `logTokenUsage()` function for cost/token logging.
5. Chat sessions and messages now support optional `runId` linking.
6. Added `logModelResponse()` function to persist model response metadata.
7. Output mode templates include markdown formatting guidance.
8. Finding parser extracts FIXME, TODO, BUG, HACK, and severity markers.

## 1.6.0 Review Automation

Status: complete.

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

Completion notes:

1. Review lane model exists in `apps/zetro/src/services/review-lanes.ts` with 8 lanes (architecture, security, performance, code-quality, testing, documentation, compliance, general).
2. Review service exists in `apps/zetro/src/services/review-service.ts` with severity/confidence mapping, content parsing, and summary building.
3. Review API routes exist in `apps/api/src/internal/zetro-routes.ts` (`/zetro/review/lanes`, `/zetro/review/parse`, `/zetro/review/summarize`).
4. Review workspace item registered in `apps/zetro/shared/workspace-items.ts` and `apps/zetro/web/src/workspace-sections.tsx`.
5. Review dashboard page exists in `apps/zetro/web/src/pages/review-page.tsx` with lane overview, parsing form, and finding cards.
6. Terminal commands added: `review-lanes` and `review-summary [--run <id>]`.
7. Typecheck and doctor pass.

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
