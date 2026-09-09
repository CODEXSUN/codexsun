# Zetro Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Zetro is a standalone development desk with task execution and provider-backed agent APIs. It is a product application and does not place agent behavior in the CODEXSUN framework kernel.

## Ownership

- `api/src/modules/codex-connection` owns local Codex account status, device authorization, and App Server turns.
- `api/src/modules/chat` owns provider-backed turns, private conversation history, archive state, and permanent conversation deletion.
- `api/src/modules/projects` owns registered local repository workspaces.
- `api/src/modules/developer-tools` owns Git actions, monitoring, and trusted tool launchers.
- `api/src/modules/git-delivery` owns reviewed release system tasks and their settings.
- `api/src/modules/system-tasks` owns durable execution, recovery, cancellation, retries, and queues.
- `api/src/modules/operations` owns runtime metrics, connected app status, retention, and diagnostics.
- `api/src/modules/tasks` owns project-scoped task records and private file persistence.
- `web/src/modules/desk` owns the Zetro Desk shell, workspace, and sidebar surfaces.
- `web/src/modules/agent-chat` owns active and archived history, messages, and prompt input.
- `web/src/modules/projects` owns the active project and sidebar project switcher.
- `web/src/modules/developer-tools` owns shared repository tools and their settings.
- `web/src/modules/git-delivery` owns the interactive GitHub delivery flow builder.
- `web/src/modules/automation` owns deterministic run controls and reviewed diagnostic handoff.
- `web/src/modules/operations` owns the metrics control, worktree manager, and retention settings.
- `web/src/modules/project-tasks` owns project task management.
- `web/src/modules/settings` owns centralized application preferences,
  appearance, ITO visibility, connection status, and device activation UI.
- `desktop` owns the Tauri window, bundled API process, native folder picker, and WiX MSI.
- `cli` owns the terminal client for the shared Zetro API contracts.
- The web `app.tsx` is the thin composition root.

The composition root supplies Zetro identity and runtime status to the shared
`@codexsun/ui/layouts/mdi-main` frame. Codex settings remain app-owned content.
It supplies project activities and utilities to
`@codexsun/ui/layouts/agent-workspace`, which keeps fixed icon rails around the
project sidebar and workspace without moving Zetro state into the UI package.

The only public product route is `/zetro`. It opens the agent chat inside Zetro
Desk. Project Chat, Tasks, and Settings switch inside this one Desk route.

## Workspaces and commands

| Workspace                 | Purpose            | Development command             | Default address               |
| ------------------------- | ------------------ | ------------------------------- | ----------------------------- |
| `@codexsun/zetro-api`     | Agent and task API | `npm.cmd run dev:zetro-api`     | `http://127.0.0.1:6050`       |
| `@codexsun/zetro-web`     | Agent workspace    | `npm.cmd run dev:zetro`         | `http://127.0.0.1:6060/zetro` |
| `@codexsun/zetro-desktop` | Windows host       | `npm.cmd run desktop:zetro:dev` | Local Windows application     |
| `@codexsun/zetro-cli`     | Automation client  | `npm.cmd run zetro -- help`     | Local terminal                |

Build the Windows installer with `npm.cmd run desktop:zetro:msi`.

## Deployment assembly

The shared runtime holder registers `zetro-api` and `zetro-web`. Zetro requires Platform and is selected in the complete `development` profile. Customer profiles can omit Zetro; its Codex provider, chat, project, task, and worktree artifacts then remain outside the generated deployment.

The API and web remain separate component and container boundaries. Selecting Zetro does not move provider credentials into the profile; secrets remain deployment environment bindings.

The Tauri workspace packages the existing web and API components for Windows. It is not a container component and does not enter the Compose catalog.

## Runtime configuration

Root `.env` owns `ZETRO_API_PORT`, `ZETRO_WEB_PORT`, and optional Codex provider settings. The API owns local Codex account connection endpoints. The mounted Settings web module owns browser-local application preferences and composes shared MDI appearance controls.

Zetro uses `ZETRO_DB_DRIVER=sqlite` by default with WAL enabled. Set it to
`mariadb` for server-scale storage. Set `ZETRO_QUEUE_DRIVER=bullmq` with
`REDIS_URL` for a shared backend queue.

The API uses the shared Platform Core observability adapter for Pino logs, request correlation, HTTP telemetry, and safe shutdown. Production JSON output is captured by the runtime holder for Orship.

`ZETRO_CODEX_API_KEY` supplies a separate API credential to the local Codex App Server. `ZETRO_WORKTREE_ROOT` selects the parent directory for task worktrees.

The desktop host sets `ZETRO_PROJECT_ROOT`, `STORAGE_ROOT`, and
`ZETRO_WORKTREE_ROOT` to Tauri application data paths. The generated project
root is only a startup marker. Zetro does not register it as a project because
it is not a Git repository. The desktop app and browser use the same project
connection flow. The desktop host allows only the Tauri origin to call the
bundled loopback API.

The desktop host generates a random session token for every API process and sends
it through each non-health request. CORS is not used as authentication.

The shared web workspace provides one Codex model and reasoning selector in the
context bar. The same stored choice controls browser and desktop chat turns.

The shared chat composer also owns one input pipeline for browser and desktop.
It accepts picker, drag-and-drop, and clipboard files. Images remain multimodal
inputs. Long clipboard text becomes a scoped text attachment so the editor stays
responsive and Codex can inspect the complete source.

The Automation workspace and CLI use the same API contracts. Repository scripts,
Git delivery, diagnostics, worktree retention, and durable run history stay
deterministic. An agent enters the flow only after a user selects a failed run
and requests diagnosis. That handoff prepares a review prompt and does not rerun,
publish, clean, or modify the repository automatically.

On Windows, the default `codex` command resolves the newest executable from the Codex desktop installation. Set `ZETRO_CODEX_COMMAND` to a full path to override discovery.

Each conversation gets one detached Git worktree below `ZETRO_WORKTREE_ROOT`.
The worktree starts from the selected project's repository `HEAD`.

Zetro does not copy uncommitted main-checkout changes into a new worktree. The
operations manager shows disk usage and removes only clean validated worktrees
through an explicit action or a configured retention sweep.

## Provider workflows

The Chat API supports five workflows for provider-backed turns:

- **Deliver** runs the complete governed delivery pipeline.
- **Develop** implements a focused change and runs proportionate checks.
- **Document** reads source evidence and updates the owning repository documents.
- **Review** inspects code and reports prioritized findings without editing by default.
- **Test** reproduces behavior and separates existing failures from regressions.

Each response stores the selected workflow in its execution summary.

### Delivery pipeline

| Stage     | Required result                                                         |
| --------- | ----------------------------------------------------------------------- |
| Plan      | Define the outcome, scope, risks, acceptance criteria, and checks.      |
| Observe   | Read repository rules, status, source ownership, and current behavior.  |
| Review    | Test the plan against repository evidence before editing.               |
| Assign    | Name the task, owner module, worktree, and completion criteria.         |
| Implement | Make the smallest complete change in the isolated worktree.             |
| Verify    | Review the diff and run focused and required repository checks.         |
| Document  | Update owner READMEs, catalogs, development records, and the changelog. |
| Version   | Use the repository version command when the task includes a release.    |
| Publish   | Commit and push only after explicit authorization and final checks.     |

Each stage reports `complete`, `skipped`, `ready`, or `blocked` with evidence. A skipped stage must include a reason.

The publish gate checks the intended file set, branch, upstream, version, changelog, and test results. Zetro does not publish when unrelated changes are staged.

Deliver replies contain a structured delivery record. Zetro validates all nine stages, adds timestamps, computes publication readiness, and saves the record in conversation history.

The next Deliver turn receives the latest validated record. This lets Codex resume the delivery while it checks whether earlier evidence is still current.

## Health and shutdown

The API provides `/health`, `/health/live`, and `/health/ready`. The root `dev:zetro` command starts both services through the shared preflight supervisor.

The API handles `SIGINT`, `SIGTERM`, and supervisor IPC. Shutdown closes Fastify and the local Codex App Server process.

The desktop host owns its bundled API process. It stops the process tree on normal exit. The API also stops when its desktop parent exits.

## Verification

Run `npm.cmd run test:zetro`, `npm.cmd run build:zetro`, lint, formatting, type checks, and documentation gates after a Zetro change. The root `check` gate includes the complete Zetro API test suite and validates declared module dependency ranges.

The worktree integration test creates two temporary Git worktrees. Zetro still needs a production-artifact lifecycle E2E test.

## Module catalog

The Zetro catalog is [assist/modules/zetro.md](../../assist/modules/zetro.md). It links the authoritative API and web module READMEs.
