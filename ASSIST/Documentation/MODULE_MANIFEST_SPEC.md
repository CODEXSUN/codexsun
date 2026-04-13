# Module Manifest Specification

## Purpose

This document defines the future manifest standard introduced after the modular ERP blueprint.

The current running suite still uses the existing `AppManifest` shape for app-suite composition. This specification defines the next-layer manifest model that future engines, apps, industry packs, client overlays, widget packs, and orchestration modules should converge toward.

## Why A Second Manifest Layer Exists

The current `AppManifest` is enough for:

1. app identity
2. workspace roots
3. current dependencies
4. high-level surfaces

The future platform needs more than that:

1. workspace contributions
2. feature flags
3. settings declarations
4. permissions declarations
5. route contribution declarations
6. builder and widget registration
7. industry-pack and client-overlay composition

That is why the future `ModuleManifest` exists alongside the current `AppManifest`.

## Manifest Types

Supported module manifest types:

1. `engine`
2. `app`
3. `industry-pack`
4. `client-overlay`
5. `widget-pack`
6. `orchestration`

## Shared Contract

The shared TypeScript contract lives in:

- [module-manifest.ts](/E:/Workspace/codexsun/apps/framework/shared/module-manifest.ts:1)

Core fields:

1. `id`
2. `type`
3. `displayName`
4. `summary`
5. `dependencies`
6. `featureFlags`
7. `workspaceContributions`
8. `routeContributions`
9. `permissions`
10. `settings`
11. `widgets`
12. `builders`
13. `migrations`
14. `seeders`

## Dependency Model

Dependencies are explicit objects, not just strings.

Each dependency declares:

1. `id`
2. `kind`
3. optional `optional`

Supported dependency kinds:

1. `engine`
2. `shared-package`
3. `app`
4. `industry-pack`
5. `client-overlay`
6. `orchestration`

Rules:

1. `client-overlay` may depend on `industry-pack`, `app`, `engine`, `shared-package`, and `orchestration`
2. `industry-pack` may depend on `app`, `engine`, and `shared-package`
3. `app` may depend on `engine` and `shared-package`
4. `engine` must not depend on `app`, `industry-pack`, or `client-overlay`

## Workspace Contributions

Workspace should eventually be built from manifest contributions instead of hardcoded navigation.

Supported contribution types:

1. `workspace`
2. `module`
3. `page`
4. `report`
5. `widget`
6. `action`

Each contribution may declare:

1. `id`
2. `type`
3. `label`
4. `route`
5. `appId`
6. `parentId`
7. `summary`
8. `roles`
9. `featureFlags`

Rules:

1. contributions must be filterable by role and feature flag
2. parent-child relationships must be explicit through `parentId`
3. route ownership must stay with the owning module, even when another layer enables or hides it

## Feature Flags

Feature flags are manifest-declared and scoped.

Supported scopes:

1. `global`
2. `industry`
3. `client`
4. `role`
5. `environment`

Rules:

1. flags should be declared by the module that owns the feature
2. clients and industry packs should enable or disable through configuration rather than by forking code
3. flag resolution must stay inspectable for support and operations

## Route Contributions

Route contributions make transport ownership visible without embedding the entire route implementation in the manifest.

Each route contribution declares:

1. `id`
2. `surface`
3. `path`
4. optional `summary`

Supported surfaces:

1. `web`
2. `internal-api`
3. `external-api`
4. `worker`
5. `cli`

## Settings Declarations

Settings declarations are metadata for future configuration UIs and validation.

Each declaration includes:

1. `key`
2. `label`
3. `valueType`
4. optional `summary`
5. optional `required`

Supported `valueType` values:

1. `string`
2. `number`
3. `boolean`
4. `json`
5. `enum`

## Current Relationship To AppManifest

The current repo still composes apps through `AppManifest`.

Near-term rule:

1. `AppManifest` remains the runtime composition contract for the current suite
2. `ModuleManifest` becomes the future planning and gradual migration contract
3. do not break current runtime composition just to force early manifest migration

## First Example: Industry Pack

Example planning shape for `computer-retail`:

1. type: `industry-pack`
2. depends on:
   - `commerce-app`
   - `billing-app`
   - `inventory-app`
   - `document-engine`
3. contributes:
   - retail sales workspace
   - POS or counter-sales widgets later
   - stock-alert reports
   - customer repair or service workflow flags later

## First Example: Client Overlay

Example planning shape for `techmedia`:

1. type: `client-overlay`
2. depends on:
   - `computer-retail`
   - `commerce-app`
   - `billing-app`
3. contributes:
   - client branding
   - enabled retail and billing workspaces
   - disabled unrelated warehouse-complexity modules
   - client-specific report formats
   - deployment metadata

## First Current-To-Target Inventory

Current repo apps map into the target model like this:

| Current module | Current role | Future target role |
| --- | --- | --- |
| `apps/framework` | runtime and host composition | split gradually into `engines/*` plus framework composition shell |
| `apps/api` | route-only boundary | shared transport app or route layer under app manifests |
| `apps/ui` | shared UI and docs | shared UI package plus docs app |
| `apps/core` | shared masters | shared-package plus shared master-data app boundary |
| `apps/cxapp` | active suite shell | control-plane-facing shell app and tenant-facing shell surfaces |
| `apps/billing` | finance app | standalone `billing-app` |
| `apps/ecommerce` | commerce app | standalone `commerce-app` |
| `apps/crm` | CRM app | standalone `crm-app` |
| `apps/demo` | demo and installer app | standalone `demo-app` plus Codexsun demo mode support |
| `apps/frappe` | ERPNext integration app | standalone integration app plus future integration-engine consumers |
| `apps/tally` | reserved integration app | standalone integration app later |
| `apps/task` | reserved task app | standalone `task-app` later |
| `apps/site` | presentation app | public site app |
| `apps/cli` | operations tooling | orchestration and operational tooling layer |
| `apps/mobile` | companion client | separate client app consuming shared contracts |

## Planned Next Inventory Work

The next architecture batch should produce:

1. a manifest inventory for every current app
2. a first draft `industry-pack` inventory
3. a first draft `client-overlay` inventory for:
   - `techmedia`
   - `tirupurdirect`
   - `thetirupurtextiles`
   - `horse-club`
   - `neot`
4. a workspace matrix by client, industry, and user role
