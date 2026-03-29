# Workspace, Hosts, And Assembly Baseline

## Purpose

This file defines the real workspace and host baseline for Codexsun under the current `apps/` model.

Use this plan when adding:

1. a new app root
2. a new framework composition root
3. a new backend or desktop host
4. a new shared package
5. a new machine-readable workspace or host manifest

## Current Repository Roots

Implemented roots today:

1. `apps/framework`
2. `apps/cxapp`
3. `apps/core`
4. `apps/api`
5. `apps/site`
6. `apps/ui`
7. `apps/billing`
8. `apps/ecommerce`
9. `apps/task`
10. `apps/frappe`
11. `apps/tally`
12. `apps/cli`

## Standard App Shape

Every app currently follows:

```text
apps/<app>/
  src/
  web/
  database/
    migration/
    seeder/
  helper/
  shared/
```

## Responsibility Split

### Framework

`apps/framework` owns platform runtime and composition.

It owns:

1. config
2. database runtime
3. HTTP route assembly
4. suite registration
5. host startup
6. machine-readable workspace and host baseline assembly

It does not own:

1. app-specific business workflows
2. app-specific page state
3. billing or ecommerce domain behavior

### UI

`apps/ui` owns shared UI and UX.

It owns:

1. reusable primitives
2. reusable layout blocks
3. shared styles
4. shared desk-shell presentation
5. shared auth-layout presentation
6. design-system docs presentation

### CxApp

`apps/cxapp` owns the active shell.

It owns:

1. the active web bootstrap
2. the active server wrapper
3. suite routing
4. auth page wiring
5. workspace orchestration

### Documentation

`ASSIST/Documentation` is the current written documentation surface until a dedicated docs app is introduced.

## Assembly Baseline

### Framework Assembly

Current shape:

```text
apps/framework/src/
  application/
  di/
  runtime/
    config/
    database/
    http/
  server/
```

Rule:

1. framework assemblies stay capability-first
2. runtime code stays reusable across standalone apps
3. framework bootstrap may render app shells, but must not absorb app business logic

### UI Assembly

Current shape:

```text
apps/ui/src/
  assets/
    css/
  blocks/
  components/
    ui/
    ux/
  features/
    dashboard/
    docs/
  layouts/
  lib/
```

Rule:

1. shared presentation belongs here
2. business workflows do not

### Host Assembly

Current active host entry points:

1. `apps/cxapp/web/src/main.tsx`
2. `apps/cxapp/web/src/app-shell.tsx`
3. `apps/cxapp/src/server/index.ts`
4. `apps/framework/src/server/index.ts`

Current active machine-readable baseline:

1. framework builder under `apps/framework/src/application`
2. internal route at `/internal/baseline`

## Database And Migration Assembly

Current reality:

1. framework owns runtime database driver switching
2. app-local `database/migration` and `database/seeder` roots exist across the app tree
3. ordered migration sections are still future work

Rules:

1. new business tables must not be added into generic framework runtime files
2. each app must own its own migration and seeder boundary as domain work deepens
3. SQLite smoke-safe behavior should remain possible for future offline paths

## Current Commands

Current main commands:

1. `npm run dev`
2. `npm run build`
3. `npm run lint`
4. `npm run test`
5. `npm run typecheck`
6. `npm run start`

## Extension Order

When extending the platform, follow this order:

1. choose the correct app boundary
2. add or update shared contracts
3. add or update machine-readable workspace metadata if host assembly changes
4. wire the composition root or runner
5. add docs
6. validate typecheck, lint, test, and build

## Verification

Use these commands after architecture or host changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If they pass, the current workspace baseline is structurally valid.
