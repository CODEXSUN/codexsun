# Zetro 2.0 foundation reset

## Outcome

The v1 Zetro implementation was copied to the external reference folder
`E:\new workspace\codexsun-zetro-v1-backup-20260911`. The snapshot includes the
working-tree state present before the reset.

The active product now contains only:

- a presentation-only React shell that preserves the established Zetro layout;
- public `@codexsun/ui` components and layouts.

## Removed active behavior

- Zetro API and CLI workspaces;
- provider, chat, project, task, automation, Git, operations, worktree, database,
  queue, settings, and execution logic;
- bundled Node API startup and native repository commands;
- API runtime bindings, proxies, and deployment components.

The follow-up frontend cleanup also removed the temporary Tauri host, its build
helper, and every Zetro-specific root npm command except `dev:zetro` and
`build:zetro`.

## Decision

Zetro 2.0 will rebuild one reviewed module contract at a time. The first product
discussion covers Chat through a confirmed structured task draft. Later workflow
stages remain excluded until Chat is accepted.
