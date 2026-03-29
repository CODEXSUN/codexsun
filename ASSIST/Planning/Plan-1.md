# Workspace, Hosts, And Assembly Baseline

## Purpose

This file defines the real baseline architecture for Codexsun under the current `apps/` model.

Use this file when adding:

1. a new app root
2. a new framework composition root
3. a new backend or desktop host
4. a new shared package
5. a new operational or documentation surface

## Current Repository Roots

Implemented roots today:

1. `apps/framework`
2. `apps/ui`
3. `apps/cli`
4. `apps/docs`

Planned roots next:

1. `apps/core`
2. `apps/billing`
3. `apps/ecommerce`
4. `apps/task`
5. `apps/frappe`
6. `apps/site`
7. `apps/orekso`
8. `apps/mcp`

## Responsibility Split

### Framework

`apps/framework` owns platform runtime and composition.

It owns:

1. config
2. auth
3. database runtime
4. migrations
5. connector contracts
6. app bootstrap
7. future backend and desktop composition roots

It does not own:

1. app-specific business workflows
2. shared presentation primitives
3. billing or ecommerce tables

### UI

`apps/ui` owns shared UI and UX.

It owns:

1. reusable primitives
2. reusable UX building blocks
3. shared styles
4. shared theme providers

### CLI

`apps/cli` owns operational commands.

It owns:

1. githelper
2. versioning helpers
3. future environment checks
4. future database and deployment control commands if they must be repository-wide

### Docs

`apps/docs` owns public module and package documentation.

It must document:

1. module ownership
2. build and usage instructions
3. migration workflow rules
4. package redistribution notes

### Future Business Apps

Future business apps such as `billing`, `ecommerce`, and `task` own:

1. domain workflows
2. routes
3. app-specific UI composition
4. business tables outside the framework foundation

## Assembly Baseline

### Framework Assembly

Current shape:

```text
apps/framework/src/
  app/
  auth/
  connectors/
  runtime/
    config/
    database/
      migrations/
      schema/
```

Rule:

1. framework assemblies stay capability-first
2. runtime code stays reusable across standalone apps
3. framework bootstrap may render app shells, but must not absorb app business logic

### UI Assembly

Current shape:

```text
apps/ui/src/
  components/
    ui/
    ux/
  lib/
  styles/
  theme/
```

Rule:

1. shared presentation belongs here
2. app-specific components do not

### CLI Assembly

Current shape:

```text
apps/cli/src/
  shared/
  versioning/
  githelper.ts
```

Rule:

1. CLI tasks must stay operational and explicit
2. repository workflow logic belongs here instead of hidden scripts

### Docs Assembly

Current shape:

```text
apps/docs/
  framework/
  ui/
```

Rule:

1. every new shared package or framework module needs public docs here
2. do not hide public usage rules only inside `ASSIST`

## Database And Migration Assembly

Framework owns the platform-foundation database layer.

Current database shape:

```text
apps/framework/src/runtime/database/
  schema/
    sections/
  migrations/
    modules/
      platform/
        sections/
```

Rules:

1. schema contracts must be split by ordered section under `schema/sections`
2. migrations must be split by module and ordered section under `migrations/modules/<module>/sections`
3. do not keep one catch-all migration file for unrelated tables
4. each major table or stable logical table group must live in its own ordered file or ordered section file
5. registries compose section files; section files own real table creation logic
6. new business tables must not be added into the framework foundation migration set
7. every migration increment must have a testable path, with SQLite smoke testing as the minimum local check

## Current Commands

Current main commands:

1. `npm run dev:framework`
2. `npm run build`
3. `npm run db:migration:list`
4. `npm run db:migrate`
5. `npm run db:test:migrations`
6. `npm run githelper -- check`

## Extension Order

When extending the platform, follow this order:

1. choose the correct app boundary
2. add or update shared contracts
3. add ordered migration sections if database work is required
4. wire the composition root or runner
5. add docs
6. validate typecheck, build, and the relevant runtime checks

## Verification

Use these commands after architecture or database changes:

```bash
npm run typecheck
npm run build
npm run db:test:migrations
```

If they pass, the current workspace and database baseline are structurally valid.
