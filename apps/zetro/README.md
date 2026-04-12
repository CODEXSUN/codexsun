# Zetro

Terminal-first, dashboard-backed agent workspace for planning, reviewing, and safely executing Codexsun work.

## Overview

Zetro is a self-hosted agent workspace that prioritizes operator control, auditability, and structured output. It combines:

- **Terminal interface** for quick planning, catalog inspection, and future agent workflows
- **Dashboard UI** for managing runs, findings, and settings
- **Structured review lanes** for organizing AI-generated findings
- **Controlled loop execution** with bounded iterations and safety rails

## Quick Start

### Dashboard

```powershell
npm.cmd run dev
# Open http://localhost:5173/dashboard/apps/zetro
```

### Terminal

```powershell
npm.cmd run zetro -- help
npm.cmd run zetro -- summary
npm.cmd run zetro -- playbooks
npm.cmd run zetro -- chat
```

## Current Status

**Phase 2.1.0 Complete**

### Phase 1: Foundation

- [x] App shell and static surface
- [x] Database persistence (playbooks, runs, findings, guardrails, settings)
- [x] Run output sections
- [x] Advisory command proposals
- [x] Runner policy and allowlist
- [x] Approved CLI runner
- [x] Model provider adapters (none, ollama-local, openai, anthropic)
- [x] Terminal agent mode with chat sessions
- [x] Maximum output engine
- [x] Review automation (8 structured lanes)
- [x] Controlled loop service
- [x] Dashboard loop control

### Phase 2: Evolution

- [x] **2.1.0 Semantic Memory Layer** — Vector embeddings with Ollama
- [ ] 2.2.0 Smart Playbooks
- [ ] 2.3.0 Multi-Model Task Router
- [ ] 2.4.0 Agent Role Specialization
- [ ] 2.5.0 Tiered Autonomy System
- [ ] 2.6.0 Task Integration Layer
- [ ] 2.7.0 External Integration Layer

**Runner mode: manual** — No command execution unless explicitly enabled.

## Architecture

### Directory Structure

```
apps/zetro/
├── src/
│   ├── services/           # Business logic and data access
│   │   ├── allowlist-service.ts
│   │   ├── chat-service.ts
│   │   ├── command-proposal-service.ts
│   │   ├── finding-service.ts
│   │   ├── guardrail-service.ts
│   │   ├── loop-service.ts
│   │   ├── model-provider-adapters.ts
│   │   ├── model-provider-service.ts
│   │   ├── model-provider-types.ts
│   │   ├── output-section-service.ts
│   │   ├── playbook-service.ts
│   │   ├── prompt-builder.ts
│   │   ├── review-lanes.ts
│   │   ├── review-service.ts
│   │   ├── run-service.ts
│   │   ├── runner-service.ts
│   │   ├── settings-service.ts
│   │   └── zetro-summary-service.ts
│   ├── data/               # Database query helpers
│   │   └── query-database.ts
│   └── terminal.ts         # Terminal CLI entry point
├── database/
│   ├── table-names.ts      # All table name constants
│   ├── migration/         # 11 database migrations
│   └── seeder/            # Default seed data
├── shared/                 # Shared types and static data
│   ├── workspace-items.ts
│   ├── output-modes.ts
│   ├── playbook-contracts.ts
│   └── static-playbooks.ts
├── web/
│   ├── src/
│   │   ├── api/           # Dashboard API client
│   │   └── pages/         # Dashboard pages
│   └── src/workspace-sections.tsx
└── ASSIST/                # Build documentation
```

### Database Tables

All tables follow the `zetro_<plural_name>` naming convention:

| Table Name                  | Purpose               |
| --------------------------- | --------------------- |
| `zetro_playbooks`           | Playbook definitions  |
| `zetro_playbook_phases`     | Playbook phases       |
| `zetro_runs`                | Workflow runs         |
| `zetro_run_events`          | Run event timeline    |
| `zetro_run_output_sections` | Structured run output |
| `zetro_command_proposals`   | Command proposals     |
| `zetro_command_allowlist`   | Allowed commands      |
| `zetro_executed_commands`   | Execution records     |
| `zetro_chat_sessions`       | Chat sessions         |
| `zetro_chat_messages`       | Chat messages         |
| `zetro_findings`            | Review findings       |
| `zetro_guardrails`          | Guardrail templates   |
| `zetro_settings`            | Runtime settings      |
| `zetro_loop_states`         | Loop iteration state  |

## Features

### 1. Playbooks

Structured workflows with phases and approval gates.

**Terminal commands:**

```powershell
npm.cmd run zetro -- playbooks
npm.cmd run zetro -- playbook <id>
```

**Dashboard pages:** `/dashboard/apps/zetro/playbooks`

### 2. Output Modes

Structured response formats for different contexts:

| Mode       | Description                                       |
| ---------- | ------------------------------------------------- |
| `brief`    | Short answer with next action                     |
| `normal`   | Summary with files and steps                      |
| `detailed` | Full context with plan, files, tests, risks       |
| `maximum`  | Maximum useful output for implementation planning |
| `audit`    | Maximum plus approvals, command log, follow-ups   |

### 3. Runs

Manual and supervised workflow execution tracking.

**Terminal commands:**

```powershell
npm.cmd run zetro -- runs
npm.cmd run zetro -- run <id>
npm.cmd run zetro -- create-run --title <v> --playbook <id> --summary <v>
npm.cmd run zetro -- add-event --run <id> --summary <v>
npm.cmd run zetro -- output <runId>
```

**Dashboard pages:** `/dashboard/apps/zetro/runs`

### 4. Findings

Structured issue tracking with severity and confidence.

**Terminal commands:**

```powershell
npm.cmd run zetro -- findings
npm.cmd run zetro -- create-finding --title <v> --summary <v>
npm.cmd run zetro -- finding-status --finding <id> --status <status>
```

**Dashboard pages:** `/dashboard/apps/zetro/findings`

### 5. Command Proposals

Advisory workflow for command execution approval.

**Terminal commands:**

```powershell
npm.cmd run zetro -- proposals [--run <id>]
npm.cmd run zetro -- propose --run <id> --cmd <v> --summary <v>
npm.cmd run zetro -- approve <proposalId>
npm.cmd run zetro -- reject <proposalId>
```

### 6. Guardrails

Safety rules for future autonomous execution.

**Terminal commands:**

```powershell
npm.cmd run zetro -- guardrails
```

**Dashboard pages:** `/dashboard/apps/zetro/guardrails`

### 7. Review Lanes

8 structured categories for organizing AI-generated findings:

| Lane            | Description                     | Default Severity |
| --------------- | ------------------------------- | ---------------- |
| `architecture`  | System design and structure     | High             |
| `security`      | Vulnerabilities and auth issues | Critical         |
| `performance`   | N+1, memory leaks, slow queries | High             |
| `code-quality`  | Type safety, error handling     | Medium           |
| `testing`       | Coverage gaps and test quality  | Medium           |
| `documentation` | Missing docs and comments       | Low              |
| `compliance`    | License and regulatory issues   | High             |
| `general`       | Unclassified findings           | Medium           |

**Terminal commands:**

```powershell
npm.cmd run zetro -- review-lanes
npm.cmd run zetro -- review-summary --run <id>
```

**Dashboard pages:** `/dashboard/apps/zetro/review`

### 8. Controlled Loop

Bounded iterative execution with safety rails.

**Features:**

- Max iterations (default: 10)
- Hard timeout (default: 30 minutes)
- Stop conditions: max-iterations, timeout, zero-critical-findings
- Dry-run mode (default: true)
- Visible cancel
- Full iteration event log

**Terminal commands:**

```powershell
npm.cmd run zetro -- loop <runId>
npm.cmd run zetro -- loop-start --run <id> [--max <n>] [--timeout <ms>]
npm.cmd run zetro -- loop-stop --run <id>
npm.cmd run zetro -- loop-cancel --run <id>
npm.cmd run zetro -- loop-events --run <id>
```

### 9. Interactive Shell

Terminal-based chat with model providers.

```powershell
npm.cmd run zetro -- chat [--provider=<id>] [--mode=<mode>]

# Providers: none, ollama-local, openai, anthropic
# Modes: brief, normal, detailed, maximum, audit
```

### 10. Plan Scaffold

Maximum-output plan template generator.

```powershell
npm.cmd run zetro -- plan "build persisted playbooks"
```

## API Routes

All routes require authentication and are prefixed with `/internal/v1/zetro/`.

### Playbooks

- `GET /zetro/playbooks` — List playbooks
- `GET /zetro/playbook?id=<id>` — Get one playbook
- `GET /zetro/summary` — Dashboard summary

### Runs

- `GET /zetro/runs` — List runs
- `GET /zetro/run?id=<id>` — Get run with details
- `POST /zetro/runs` — Create run
- `POST /zetro/run/events?id=<runId>` — Add event
- `PUT /zetro/run/output-sections` — Replace output sections

### Findings

- `GET /zetro/findings` — List findings
- `POST /zetro/findings` — Create finding
- `PATCH /zetro/finding?id=<id>` — Update status

### Command Proposals

- `POST /zetro/run/command-proposals` — Create proposal
- `PATCH /zetro/command-proposal?id=<id>` — Update status
- `POST /zetro/execute` — Execute approved command
- `POST /zetro/execute/proposal` — Approve and execute

### Allowlist

- `GET /zetro/allowlist` — List allowed commands
- `POST /zetro/allowlist/entry` — Add allowed command
- `GET /zetro/allowlist/blocked` — List blocked commands
- `POST /zetro/allowlist/blocked` — Add blocked command

### Review

- `GET /zetro/review/lanes` — List review lanes
- `POST /zetro/review/parse` — Parse content for findings
- `POST /zetro/review/summarize` — Build finding summary

### Loop

- `GET /zetro/loop/state?id=<runId>` — Get loop state
- `POST /zetro/loop/configure?id=<runId>` — Configure loop
- `POST /zetro/loop/start?id=<runId>` — Start loop
- `POST /zetro/loop/stop?id=<runId>` — Stop loop
- `POST /zetro/loop/cancel?id=<runId>` — Cancel loop
- `GET /zetro/loop/events?id=<runId>` — List iteration events

### Memory (Phase 2.1)

- `GET /zetro/memory/search?q=<query>` — Search memory vectors
- `GET /zetro/memory/similar-findings?id=<id>&title=<v>&summary=<v>` — Find similar findings
- `POST /zetro/memory/store` — Store a memory vector
- `GET /zetro/memory/vectors` — List memory vectors
- `GET /zetro/memory/stats` — Get memory statistics
- `DELETE /zetro/memory/vector/:id` — Delete a memory vector
- `DELETE /zetro/memory/clear` — Clear memory vectors

### Settings

- `GET /zetro/settings` — Read settings
- `GET /zetro/policy` — Read runner policy

### Providers

- `GET /zetro/providers` — List providers
- `GET /zetro/provider/settings` — Read provider settings
- `GET /zetro/provider/health` — Check provider health

## Terminal Commands Reference

```
npm.cmd run zetro -- help                         Show help
npm.cmd run zetro -- status                        Show data source and counts
npm.cmd run zetro -- summary                       Show catalog summary
npm.cmd run zetro -- playbooks                     List playbooks
npm.cmd run zetro -- playbook <id>                 Show one playbook
npm.cmd run zetro -- modes                         List output modes
npm.cmd run zetro -- guardrails                    List guardrails
npm.cmd run zetro -- runs                          List runs
npm.cmd run zetro -- run <id>                      Show run details
npm.cmd run zetro -- create-run                    Create a run
npm.cmd run zetro -- add-event                     Add run event
npm.cmd run zetro -- output <runId>                Show run output
npm.cmd run zetro -- proposals                     List proposals
npm.cmd run zetro -- propose                       Create proposal
npm.cmd run zetro -- approve <id>                  Approve proposal
npm.cmd run zetro -- reject <id>                   Reject proposal
npm.cmd run zetro -- findings                      List findings
npm.cmd run zetro -- create-finding                Create finding
npm.cmd run zetro -- finding-status                Update finding status
npm.cmd run zetro -- review-lanes                  List review lanes
npm.cmd run zetro -- review-summary                Show review summary
npm.cmd run zetro -- loop <runId>                 Show loop state
npm.cmd run zetro -- loop-start                   Start loop
npm.cmd run zetro -- loop-stop                     Stop loop
npm.cmd run zetro -- loop-cancel                   Cancel loop
npm.cmd run zetro -- loop-events                   List iteration events
npm.cmd run zetro -- memory-search <query>        Search memory for similar content
npm.cmd run zetro -- memory-similar                Find similar past findings
npm.cmd run zetro -- memory-store                  Store content in memory
npm.cmd run zetro -- memory-list                   List memory vectors
npm.cmd run zetro -- memory-stats                 Show memory statistics
npm.cmd run zetro -- plan <request>                Generate plan scaffold
npm.cmd run zetro -- assist                        Show assist files
npm.cmd run zetro -- doctor                        Validate catalog
npm.cmd run zetro -- chat                          Start interactive shell
```

## Dashboard Pages

| Route                                   | Description          |
| --------------------------------------- | -------------------- |
| `/dashboard/apps/zetro`                 | Overview             |
| `/dashboard/apps/zetro/claude-analysis` | Claude Code analysis |
| `/dashboard/apps/zetro/playbooks`       | Playbook catalog     |
| `/dashboard/apps/zetro/rollout-plan`    | Implementation plan  |
| `/dashboard/apps/zetro/runs`            | Run console          |
| `/dashboard/apps/zetro/findings`        | Findings board       |
| `/dashboard/apps/zetro/review`          | Review lanes         |
| `/dashboard/apps/zetro/memory`          | Semantic memory      |
| `/dashboard/apps/zetro/guardrails`      | Guardrail templates  |
| `/dashboard/apps/zetro/settings`        | Settings             |

## Services

All services are located in `apps/zetro/src/services/` and exported via `index.ts`:

| Service                       | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `allowlist-service.ts`        | Command allowlist and policy checks |
| `chat-service.ts`             | Chat sessions and messages          |
| `command-proposal-service.ts` | Create, approve, reject proposals   |
| `finding-service.ts`          | Finding CRUD operations             |
| `guardrail-service.ts`        | Guardrail templates                 |
| `loop-service.ts`             | Loop state and iteration tracking   |
| `memory-service.ts`           | Vector embeddings, semantic search  |
| `model-provider-*.ts`         | Model provider adapters             |
| `output-section-service.ts`   | Run output sections                 |
| `playbook-service.ts`         | Playbook CRUD                       |
| `prompt-builder.ts`           | Output mode prompts, parsing        |
| `review-lanes.ts`             | 8 review lane definitions           |
| `review-service.ts`           | Finding parsing, severity mapping   |
| `run-service.ts`              | Run CRUD and events                 |
| `runner-service.ts`           | CLI execution                       |
| `settings-service.ts`         | Runtime settings                    |
| `zetro-summary-service.ts`    | Dashboard summary                   |

## Development

### Typecheck

```powershell
npm.cmd run typecheck
```

### Doctor

```powershell
npm.cmd run zetro -- doctor
```

### Database

```powershell
npm.cmd run db:status
npm.cmd run db:migrate
npm.cmd run db:seed
```

## Security Model

### Runtime Lock

The runtime lock prevents unintended execution:

```typescript
{
  runnerMode: "manual",
  commandExecution: "disabled",
  llmCalls: "disabled",
  networkCalls: "disabled",
  autonomousLoop: "disabled"
}
```

### Command Execution Flow

1. Command proposed → stored as proposal with `pending` status
2. Operator reviews and approves or rejects
3. If approved, command enters execution queue
4. Allowlist is checked
5. Guardrails are evaluated
6. Command is executed (if runner mode is enabled)
7. Results are stored as run events

### Sensitive Commands

Commands matching these patterns require extra review:

- `rm -rf`, `del /f /s`, `Format-`
- `chmod 777`, `icacls`
- `curl` with sensitive headers
- `git push --force`
- `ssh` with passwords

## Environment Variables

| Variable                  | Default                  | Description                                            |
| ------------------------- | ------------------------ | ------------------------------------------------------ |
| `ZETRO_PROVIDER`          | `none`                   | Model provider (none, ollama-local, openai, anthropic) |
| `ZETRO_OLLAMA_URL`        | `http://localhost:11434` | Ollama server URL                                      |
| `ZETRO_OLLAMA_MODEL`      | `llama3.2`               | Ollama model name                                      |
| `ZETRO_OPENAI_API_KEY`    | —                        | OpenAI API key                                         |
| `ZETRO_ANTHROPIC_API_KEY` | —                        | Anthropic API key                                      |

## Build Phases

See `ASSIST/END_TO_END_CREATION.md` for the complete build roadmap.

| Phase | Status   | Description                  |
| ----- | -------- | ---------------------------- |
| 1.0.0 | Complete | App shell and static surface |
| 1.1.x | Complete | Persistence foundation       |
| 1.2.0 | Complete | Manual run console           |
| 1.3.x | Complete | Advisory command proposals   |
| 1.4.0 | Complete | Approved CLI runner          |
| 1.5.x | Complete | Model provider               |
| 1.6.0 | Complete | Review automation            |
| 1.7.0 | Complete | Controlled loop              |
| 1.8.0 | Complete | Dashboard loop control       |
| 1.9.0 | Next     | Review findings integration  |

## Contributing

1. Read `ASSIST/BEHAVIOR.md` for design principles
2. Read `ASSIST/OPERATING_MODEL.md` for architecture
3. Check `ASSIST/END_TO_END_CREATION.md` for current phase
4. Run `npm.cmd run typecheck` before committing
5. Run `npm.cmd run zetro -- doctor` to validate

## License

Internal Codexsun project.
