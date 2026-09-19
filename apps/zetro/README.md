# Zetro

Zetro is the CODEXSUN idea workspace. It helps a person explore, revise, and
finish an idea before a later governed delivery workflow.

Zetro currently owns idea chat and local Codex connection controls. It does not
own task creation, worker dispatch, worktrees, product business logic, or
approval records. It must not run arbitrary unsandboxed commands or import
private files from another application.

Zetro stores conversations in its private SQLite database. It uses the shared
storage provider for temporary attachments. Future data modules must own their
migrations, repositories, backup notes, and tests.

## Configuration

Copy `api/.app.env.example` and `web/.app.env.example` to ignored `.app.env`
files. Zetro uses API port 6130 and web port 6131 by default. The local SQLite
file is private under `storage/apps/private/zetro/runtime/zetro.sqlite`.

## Verification

Run `npm.cmd run test:zetro-api`, `npm.cmd run test:zetro-web`,
`npm.cmd run preflight:zetro-api`, and `npm.cmd run preflight:zetro-web`.

Read [agent skills](agent/SKILLS.md) before work. Read
[Zetro planning](../../assist/execution/apps/zetro/planning.md) and
[Zetro task register](../../assist/execution/apps/zetro/task.md) before an agent
plans or starts Zetro work.
