# Zetro

Zetro is the CODEXSUN agentic delivery application. It turns reviewed ideas
into governed plans, tasks, isolated worker worktrees, evidence, and a manual
merge decision.

Zetro owns idea refinement, task planning, task splitting, review evidence,
worker dispatch, worktree records, test orchestration, deployment rehearsals,
and approval records. It does not own product business logic. It must not run
arbitrary unsandboxed commands or import private code from another application.

The current Zetro data decision is SQLite. The existing SQLite connection is a
working baseline. Each future data module owns its migrations, repository,
backup notes, and tests. A task must not assume that SQLite state is valid until
its required migration and repository checks pass.

## Configuration

Copy `api/.app.env.example` and `web/.app.env.example` to ignored `.app.env`
files. Zetro uses API port 6130 and web port 6131 by default. The local SQLite
file is private under `storage/apps/private/zetro/runtime/zetro.sqlite`.

## Verification

Run `npm.cmd run test:zetro-api`, `npm.cmd run test:zetro-web`,
`npm.cmd run preflight:zetro-api`, and `npm.cmd run preflight:zetro-web`.

Read [agent skills](agent/SKILLS.md) before work. Read
[Zetro planning](../../assist/execution/zetro-planning.md) and
[Zetro task register](../../assist/execution/zetro-task.md) before an agent
plans or starts Zetro work.
