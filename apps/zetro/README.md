# Zetro 2.0

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Zetro 2.0 provides one browser workflow: enter a prompt, invoke the locally
authenticated Codex CLI, and display its final response as plain text. It has no
task, automation, Git, repository, storage, settings, archive, attachment, or
voice workflow.

## Ownership

- `web` owns the chat composition and its development bridge to Codex.
- `web/src/modules/shell` owns the Zetro chat module declaration.
- `packages/ui` remains the only owner of reusable controls and layouts.

The previous implementation is outside the repository at
`E:\new workspace\codexsun-zetro-v1-backup-20260911`. It is reference material,
not an npm workspace or runtime dependency.

## Workspaces and commands

```powershell
npm.cmd run dev:zetro
npm.cmd run build:zetro
```

The browser application runs at `http://127.0.0.1:6060/zetro`. During development,
Vite owns `POST /api/chat` and keeps one local Codex app-server process warm.
Each prompt gets a new ephemeral, read-only thread outside the repository, so it
does not load repository guidance. The bridge uses the fast
`gpt-5.3-codex-spark` model with low reasoning, reuses the local Codex login, and
streams newline-delimited request, runtime-item, response, error, and completion
events. Prompts are not trimmed or extended. The chat request contains text only;
there is no attachment field. There is no separate Zetro API process or API port.

## Runtime configuration

`ZETRO_WEB_PORT` selects the browser development port and defaults to `6060`.
`ZETRO_CODEX_PATH` can select an explicit Codex executable when it is not on the
development server's `PATH`.
The production output is a static frontend under `dist/apps/zetro/web`. The Vite
preview command also supplies the local chat bridge. A later desktop phase must
provide this same local transport before the static files can run outside Vite.

## Health and shutdown

The web component uses `/` as its static readiness path. Codex turns have a
bounded timeout, and the shared app-server process closes with Vite. There is no
separate Zetro API, desktop runtime, health service, or database.

## Verification

Run `npm.cmd run build:zetro` for the focused production frontend build. The
repository-wide checks continue to validate shared UI and module boundaries.

## Module catalog

See [Zetro modules](../../assist/modules/zetro.md).

## Rebuild rule

Add one reviewed product capability at a time. Define its public contracts,
module owner, state model, boundaries, and verification before adding behavior.
Do not copy v1 source back into the active application. Use it only to compare
interaction and visual ideas.
