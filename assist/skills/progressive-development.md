# Progressive Development Skill

## Purpose and Scope

Use this skill for CODEXSUN changes that add a provider, module, application,
shared package, runtime host, or deployable profile. It supports progressive
delivery and developer handover. It does not replace module-specific rules.

## Required Inputs

- The active task ID in `assist/execution/task.md`.
- The owner path, module or provider ID, and public contracts.
- The data impact and target verification level.

If the task is not approved, update planning only. Do not write implementation
code, install dependencies, run migrations, or change deployment state.

## Working Rules

1. Read `assist/README.md`, the active task, module guidance, and affected code.
2. Keep reusable UI in `packages/ui`. Applications compose public exports only.
3. Keep business code inside its owning module. Do not use cross-module private imports.
4. Make a provider declare its ID, owner, version, dependencies, and contracts.
5. Keep root-only `node_modules`, `dist`, and `dist/.turbo/<scope>`. Do not create nested output or caches.
6. Read configuration from root `.env` and the host `.app.env`. Do not hard-code secrets, URLs, or ports.
7. Keep authored files below 700 lines. Split code by ownership and responsibility.
8. Add focused tests for the changed contract before expanding to the next task.
9. Run the relevant workspace checks and focused tests when the workspace scope permits it.
10. Update Assist planning, task status, module records, and `CHAGELOG.md` after verification.
11. Use one approved app or package worktree. Run its scoped build and checks. Wait for manual merge confirmation before integration.

## Completion Record

Record the changed owner, public contracts, data impact, checks, and limits in
the active task. Keep database changes separate from application changes in the
changelog. Do not mark a task complete from a typecheck alone when it requires a
browser, Docker, device, or production proof.

## Exclusions

Do not add a client app, migration, queue, Docker service, deployment profile,
or external integration only because the platform can support it. Each requires
its own approved task and evidence.
