# Agent Guide

This file is mandatory reading for every agent working in this repository.
Read it before inspecting, editing, or running application code.

## Required onboarding

Complete this sequence before work begins:

1. Read this file in full.
2. Read the root [README.md](README.md) for the current project state and runnable commands.
3. Read [assist/README.md](assist/README.md) for the documentation index.
4. Read [assist/governance/golden-rules.md](assist/governance/golden-rules.md) before changing code.
5. Read [assist/governance/development-records.md](assist/governance/development-records.md) before changing a module or feature.
6. Read [assist/architecture/module-standard.md](assist/architecture/module-standard.md) before creating or changing a module.
7. Read [assist/architecture/extension-standard.md](assist/architecture/extension-standard.md) before creating an add-on, adapter, or extension point.
8. Read [assist/architecture/application-standard.md](assist/architecture/application-standard.md) and [assist/architecture/runtime-foundation.md](assist/architecture/runtime-foundation.md) before creating or changing an application runtime.
9. Read every relevant guide in [assist/skills](assist/skills) before changing that area. Read both guides when a change crosses web and API boundaries.
10. Read the owning application README, module README, app catalog, and latest development record before changing a module.
11. Run `git status --short`, inspect the affected source, and preserve all unrelated work.

Do not start implementation until this onboarding is complete.

## Repository shape

- `apps/platform/web` owns the Platform browser application.
- `apps/platform/api` owns the Platform Fastify HTTP service.
- `packages/framework` owns the generic module lifecycle and registry.
- `packages/platform-core` owns reusable platform API, web, desktop, and shared packages.
- `packages/ui` owns shared web UI primitives, templates, hooks, tokens, and Tailwind theme assets.
- `packages/addons` owns independently shipped reusable add-ons after their public contracts become stable.
- `assist` owns project context, architecture decisions, and local skill guides.
- Future product apps use `apps/<product>/{api,web,desktop,mobile}`.

## Working rules

- Use npm workspaces. On Windows use `npm.cmd`, not `pnpm`.
- Keep exactly one `node_modules` directory and one `dist` directory, both at the repository root.
- Keep one `tsconfig.json` per workspace. Put TypeScript and Vite caches under root `node_modules/.cache`.
- Keep browser UI, API routes, database access, and background jobs in their owning application. Do not import an application's private source from another application.
- Define public request and response contracts before wiring a web screen to a new API endpoint. Validate external input with Zod at the API boundary.
- Do not connect MySQL, Redis, Kysely, or BullMQ until configuration, secrets, migrations, ownership, and local verification are documented.
- Do not add Tauri or Expo code until their platform-specific plan is approved.
- Write build output only to root `dist`. Store private and public files only under `storage/app`.
- Treat every build warning as a failure. Fix the cause before handoff. Do not silence a warning by raising a limit.
- Keep production JavaScript chunks at or below 400 KB. Split by feature or dependency when a chunk exceeds the budget.
- Use root preflight commands for local servers. Do not start a service when its configured port is occupied.
- Keep API and web ports in the 6000 series. The defaults are API `6010` and web `6021`.
- Keep API shutdown safe for `SIGINT`, `SIGTERM`, and supervisor IPC.
- Keep files focused, use strict TypeScript, and avoid speculative abstractions.
- Keep every authored source and documentation file at 700 lines or fewer.
- Every module needs its own README and an entry in `assist/modules/<app>.md`.
- Do not centralize business entities, CRUD behavior, schemas, forms, routes, or workflows.
- Treat each module as an installable versioned unit with explicit dependencies and lifecycle behavior.
- Do not overwrite or revert changes that you did not make.

## Validation and handoff

Run checks proportionate to the change. For cross-workspace work, run:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run build:api
npm.cmd run lint
npm.cmd run format:check
npm.cmd run check:lines
npm.cmd run check:app-docs
npm.cmd run check:module-docs
npm.cmd run check:workspace-layout
npm.cmd run check:build-output
npm.cmd run test:framework
npm.cmd run test:e2e:server
npm.cmd run check
git diff --check
```

Report changed files, commands run, results, and anything not verified. Update the relevant `assist` document whenever an architecture or workflow decision changes.
