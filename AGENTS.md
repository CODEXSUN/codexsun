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
9. Read [assist/architecture/deployment-assembly-standard.md](assist/architecture/deployment-assembly-standard.md) before changing a deployable application, add-on, profile, or container.
10. Read every relevant guide in [assist/skills](assist/skills) before changing that area. Read both guides when a change crosses web and API boundaries. Read [assist/skills/deployment-assembly.md](assist/skills/deployment-assembly.md) for deployment work.
11. Read the owning application README, module README, app catalog, and latest development record before changing a module.
12. Run `git status --short`, inspect the affected source, and preserve all unrelated work.

Do not start implementation until this onboarding is complete.

## Repository shape

- `apps/platform/web` owns the Platform browser application.
- `apps/platform/api` owns the Platform Fastify HTTP service.
- `apps/orship` owns deployment-catalog observation, local process controls, and the operations UI.
- `packages/framework` owns the generic module lifecycle and registry.
- `packages/platform-core` owns reusable platform API, web, desktop, and shared packages.
- `packages/runtime` owns deployment catalog validation, dependency resolution, and immutable assembly plans.
- `packages/ui` owns shared web UI primitives, templates, hooks, tokens, and Tailwind theme assets.
- `packages/addons` owns independently shipped reusable add-ons after their public contracts become stable.
- `.container` owns the deployable catalog, customer profiles, and common container templates.
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
- Give each readiness probe a module owner, a safe failure message, and a bounded timeout.
- Keep actor and authorization contracts neutral. Identity owns roles, permissions, sessions, and policy.
- Keep application environment schemas with their application. Use the shared parser for consistent validation.
- Load the root `.env` through `PlatformEnvironmentLoader`. Process values override file values, and explicit aliases precede safe defaults.
- Keep MariaDB administrator credentials in setup tools only. Application runtimes must use a database-scoped application account.
- Keep process control local and fail closed. A stop action requires a matching root-owned process marker; orchestration components must protect themselves from self-stop.
- Keep files focused, use strict TypeScript, and avoid speculative abstractions.
- Keep every authored source and documentation file at 700 lines or fewer.
- Every module needs its own README and an entry in `assist/modules/<app>.md`.
- Do not centralize business entities, CRUD behavior, schemas, forms, routes, or workflows.
- Treat each module as an installable versioned unit with explicit dependencies and lifecycle behavior.
- Register every deployable application and process component in `.container/catalog.json`.
- Use the `development` profile for the complete local application set. Use versioned customer profiles to select or omit applications and add-ons without changing their source.
- Treat one generated Compose project as the deployment unit and keep one API, web server, or worker process per container.
- Keep secrets out of deployment profiles. Supply them through `environment.env` or the deployment secret manager.
- A selected add-on may load only through a documented public extension point in its target application's composition root.
- Keep every migration and seed declaration inside its owning API module folder. The application root may coordinate execution, but it must not own business migrations or seed data.
- Use DDD dependency direction inside business modules: presentation depends on application, application depends on domain, and infrastructure implements inward-owned ports.
- Use declared versioned events for cross-module state changes. Publishers and consumers must declare the event in their manifests.
- Import a sibling module only through its public `index.ts`. Never import a sibling private file or write its tables directly.
- Treat applied migration and seed checksums as immutable. Add a new ordered declaration instead of editing an applied one.
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
npm.cmd run check:module-boundaries
npm.cmd run check:module-dependencies
npm.cmd run check:workspace-layout
npm.cmd run check:versions
npm.cmd run check:build-output
npm.cmd run runtime:validate
npm.cmd run test:framework
npm.cmd run test:runtime-holder
npm.cmd run test:e2e:server
npm.cmd run test:mariadb:foundation
npm.cmd run runtime:smoke -- platform-only
npm.cmd run check
git diff --check
```

Report changed files, commands run, results, and anything not verified. Update the relevant `assist` document whenever an architecture or workflow decision changes.
