# Zetro Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Zetro is a standalone development desk with task execution and provider-backed agent APIs. It is a product application and does not place agent behavior in the CODEXSUN framework kernel.

## Ownership

- `api/src/modules/codex-connection` owns local Codex account status, device authorization, and App Server turns.
- `api/src/modules/chat` owns provider-backed turns, private conversation history, archive state, and permanent conversation deletion.
- `api/src/modules/projects` owns registered local repository workspaces.
- `api/src/modules/tasks` owns project-scoped task records and private file persistence.
- `web/src/modules/desk` owns the Zetro Desk shell, workspace, and sidebar surfaces.
- `web/src/modules/agent-chat` owns active and archived history, messages, and prompt input.
- `web/src/modules/projects` owns the active project and sidebar project switcher.
- `web/src/modules/project-tasks` owns project task management.
- `web/src/modules/settings` owns connection status and device activation UI.
- The web `app.tsx` is the thin composition root.

The composition root supplies Zetro identity and runtime status to the shared
`@codexsun/ui/layouts/mdi-main` frame. Codex settings remain app-owned content.

The only public product route is `/zetro`. It opens the agent chat inside Zetro
Desk. Settings remains a source module without a public route or visible
navigation. Project Chat and Tasks switch inside this one Desk route.

## Workspaces and commands

| Workspace             | Purpose            | Development command         | Default address               |
| --------------------- | ------------------ | --------------------------- | ----------------------------- |
| `@codexsun/zetro-api` | Agent and task API | `npm.cmd run dev:zetro-api` | `http://127.0.0.1:6050`       |
| `@codexsun/zetro-web` | Agent workspace    | `npm.cmd run dev:zetro`     | `http://127.0.0.1:6060/zetro` |

## Deployment assembly

The shared runtime holder registers `zetro-api` and `zetro-web`. Zetro requires Platform and is selected in the complete `development` profile. Customer profiles can omit Zetro; its Codex provider, chat, project, task, and worktree artifacts then remain outside the generated deployment.

The API and web remain separate component and container boundaries. Selecting Zetro does not move provider credentials into the profile; secrets remain deployment environment bindings.

## Runtime configuration

Root `.env` owns `ZETRO_API_PORT`, `ZETRO_WEB_PORT`, and optional Codex provider settings. The API owns local Codex account connection endpoints. The unmounted Settings web module is available for a later approved Desk region.

`ZETRO_CODEX_API_KEY` supplies a separate API credential to the local Codex App Server. `ZETRO_WORKTREE_ROOT` selects the parent directory for task worktrees.

On Windows, the default `codex` command resolves the newest executable from the Codex desktop installation. Set `ZETRO_CODEX_COMMAND` to a full path to override discovery.

Each conversation gets one detached Git worktree below `ZETRO_WORKTREE_ROOT`.
The worktree starts from the selected project's repository `HEAD`.

Zetro does not copy uncommitted main-checkout changes into a new worktree. Zetro keeps task worktrees after conversation deletion until a separate cleanup flow removes them.

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

## Verification

Run `npm.cmd run test:zetro`, `npm.cmd run build:zetro`, lint, formatting, type checks, and documentation gates after a Zetro change.

The worktree integration test creates two temporary Git worktrees. Zetro still needs a production-artifact lifecycle E2E test.

## Module catalog

The Zetro catalog is [assist/modules/zetro.md](../../assist/modules/zetro.md). It links the authoritative API and web module READMEs.
