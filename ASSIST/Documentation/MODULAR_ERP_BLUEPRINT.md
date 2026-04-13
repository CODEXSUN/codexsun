# Modular ERP Blueprint

## Purpose

This document defines the long-term target structure for Codexsun as a plugin-first, open-source-friendly ERP platform.

This is a planning and architecture document only. It does not mean the current repository has already been migrated into this shape.

## Design Goal

Codexsun should evolve from the current semi-modular suite into a platform that can support:

1. reusable engines
2. standalone business apps
3. industry-specific bundles
4. client-specific overlays
5. user-specific workspaces
6. a Codexsun-operated control plane for multi-client hosting, deployment, support, and maintenance

## Target Layers

### 1. Engines

`engines/` holds reusable runtime or platform engines.

Examples:

1. `auth-engine`
2. `database-engine`
3. `mail-engine`
4. `media-engine`
5. `document-engine`
6. `workflow-engine`
7. `plugin-engine`
8. `tenant-engine`
9. `deployment-engine`
10. `integration-engine`

Rules:

1. engines must remain business-neutral
2. engines must not depend on industry logic, client logic, or app-specific workflows
3. engines may expose contracts, adapters, registries, and lifecycle hooks

### 2. Shared Packages

`packages/shared/` holds cross-app contracts and foundations.

Examples:

1. API schemas
2. shared core business primitives
3. shared UI system
4. permissions model
5. domain-event contracts
6. manifest types
7. report and document contracts

Rules:

1. shared packages may be used by engines and apps
2. shared packages must not embed client-specific behavior
3. shared packages must stay stable and narrow

### 3. Apps

`apps/` holds standalone business apps.

Examples:

1. `billing-app`
2. `commerce-app`
3. `crm-app`
4. `marketing-app`
5. `chat-app`
6. `documents-app`
7. `education-app`
8. `inventory-app`
9. `admin-console`

Rules:

1. every app must remain independently ownable
2. apps must not import other apps directly
3. apps must communicate only through shared contracts, internal API, framework services, shared UI, or domain events
4. apps may depend on engines and shared packages

### 4. Industry Packs

`industry-packs/` holds reusable vertical bundles.

Examples:

1. `computer-retail`
2. `garment-d2c`
3. `textile-wholesale`
4. `single-brand-retail`
5. `education-campus`

Industry packs define:

1. default enabled apps
2. default workflows
3. default permissions
4. default workspace contributions
5. default report and document sets
6. domain-specific configuration presets

Rules:

1. industry packs may compose apps and shared contracts
2. industry packs must not contain raw client-specific logic
3. industry packs should remain reusable across multiple clients in the same industry

### 5. Client Overlays

`clients/` holds client-specific overlays.

Examples:

1. `techmedia`
2. `tirupurdirect`
3. `thetirupurtextiles`
4. `horse-club`
5. `neot`

Client overlays define:

1. branding
2. enabled apps
3. disabled features
4. custom reports
5. document formats
6. deployment metadata
7. company-specific workflow toggles
8. custom settings and defaults

Rules:

1. client overlays may depend on industry packs, apps, engines, and shared packages
2. apps must never depend on client overlays
3. client overlays should prefer configuration and manifest contributions over code forks

### 6. Orchestration

`orchestration/` holds Codexsun-operated control-plane capabilities.

Examples:

1. tenant registry
2. deployment control
3. monitoring
4. support desk
5. maintenance scheduling
6. version and update orchestration
7. backup visibility
8. license and subscription control
9. cross-client accounts-office surfaces

## Dependency Direction

The target dependency direction must be:

`client overlay -> industry pack -> app -> engine/shared`

Never allow:

1. app to client-overlay imports
2. app to app direct imports
3. industry-pack to client-overlay imports
4. engine to app imports
5. engine to industry-pack imports

## Communication Rules

Modules may share behavior only through:

1. internal API contracts
2. framework services
3. shared core contracts
4. shared UI contracts
5. domain events
6. manifest-driven contributions

That means:

1. no hidden cross-app service calls
2. no reaching into another app's repositories directly
3. no client-specific logic inside neutral engines

## Module Standard

Every future engine or app should converge toward a consistent internal shape:

```text
<module>/
  manifest/
  api/
  services/
  widgets/
  builders/
  database/
  permissions/
  settings/
  routes/
```

Meaning:

1. `manifest` describes the module and its contributions
2. `api` owns transport-facing contracts or adapters
3. `services` own business logic
4. `widgets` own module-local reusable UI
5. `builders` own document, report, workflow, and page builders
6. `database` owns module persistence concerns
7. `permissions` owns role and action definitions
8. `settings` owns module settings contract
9. `routes` owns module route registration

## Manifest Model

Every engine, app, industry pack, or client overlay should eventually expose a manifest.

The next-level manifest contract and examples are documented in:

1. [MODULE_MANIFEST_SPEC.md](/E:/Workspace/codexsun/ASSIST/Documentation/MODULE_MANIFEST_SPEC.md)
2. [MODULE_INVENTORY.md](/E:/Workspace/codexsun/ASSIST/Documentation/MODULE_INVENTORY.md)
3. [WORKSPACE_VISIBILITY_MATRIX.md](/E:/Workspace/codexsun/ASSIST/Documentation/WORKSPACE_VISIBILITY_MATRIX.md)
4. [PERMISSION_MATRIX.md](/E:/Workspace/codexsun/ASSIST/Documentation/PERMISSION_MATRIX.md)
5. [FEATURE_FLAG_POLICY.md](/E:/Workspace/codexsun/ASSIST/Documentation/FEATURE_FLAG_POLICY.md)
6. [VISIBILITY_LEDGER_DESIGN.md](/E:/Workspace/codexsun/ASSIST/Documentation/VISIBILITY_LEDGER_DESIGN.md)

Minimum manifest fields:

1. `id`
2. `type`
3. `displayName`
4. `dependencies`
5. `settingsSchema`
6. `permissions`
7. `routes`
8. `workspaceContributions`
9. `featureFlags`
10. `migrations`
11. `seeders`
12. `widgets`
13. `builders`

Supported types:

1. `engine`
2. `app`
3. `industry-pack`
4. `client-overlay`
5. `widget-pack`

## Workspace Model

Workspace should become contribution-driven, not hardcoded.

Final visible workspace should be resolved from:

1. tenant or client
2. industry profile
3. enabled apps
4. user role or workspace profile
5. feature flags
6. plan or license gates where relevant

Result examples:

1. Techmedia sees computer-retail workflows and hides unrelated education or textile surfaces
2. TirupurDirect sees D2C commerce and marketing flows
3. TheTirupurTextiles sees warehouse, vendor, and wholesale flows
4. Horse Club sees a single-brand retail profile
5. Neot sees education-specific app surfaces
6. Codexsun operations sees a cross-client control workspace

The detailed visibility matrix and resolution precedence rules are documented in [WORKSPACE_VISIBILITY_MATRIX.md](/E:/Workspace/codexsun/ASSIST/Documentation/WORKSPACE_VISIBILITY_MATRIX.md).
Permission posture and support-debug explanation are documented in:

1. [PERMISSION_MATRIX.md](/E:/Workspace/codexsun/ASSIST/Documentation/PERMISSION_MATRIX.md)
2. [VISIBILITY_LEDGER_DESIGN.md](/E:/Workspace/codexsun/ASSIST/Documentation/VISIBILITY_LEDGER_DESIGN.md)

## Feature Enablement Model

Feature visibility should be resolved through explicit flags and contributions.

Scopes:

1. global platform feature
2. industry-level feature
3. client-level feature
4. user-role feature
5. environment-level feature

Rules:

1. do not fork apps just to hide one feature
2. prefer manifest-driven enable or disable logic
3. workspace filtering must be deterministic and inspectable
4. final scope and precedence rules should follow [FEATURE_FLAG_POLICY.md](/E:/Workspace/codexsun/ASSIST/Documentation/FEATURE_FLAG_POLICY.md)

## Multi-Client Model

The platform must support many clients from one repository and operational control plane.

Codexsun should support:

1. development for multiple clients
2. deployment for multiple clients
3. maintenance for multiple clients
4. support and monitoring for multiple clients
5. shared internal accounts-office and administration across clients

This means the platform needs:

1. tenant registry
2. deployment metadata
3. per-client branding and module activation
4. per-client environment and secret handling
5. controlled cross-client operational visibility

## Codexsun Role

Codexsun itself should evolve into the control plane above client tenants.

Modes:

1. `demo mode` for sales and cold-call product demos
2. `tenant mode` for actual client operation
3. `control-plane mode` for internal Codexsun operations

Codexsun control-plane responsibilities:

1. tenant provisioning
2. deployment orchestration
3. update management
4. support and maintenance
5. monitoring and health visibility
6. backup visibility
7. feature enablement
8. cross-client accounts-office workflows

## Open Source Strategy

The architecture should stay friendly to future open sourcing.

Open-source-friendly layers:

1. engines
2. shared packages
3. generic apps
4. generic industry packs

Private or commercial layers:

1. client overlays
2. managed hosting orchestration
3. premium control-plane operations
4. client-specific deployment metadata

## Migration Phases

Do not recode everything at once.

Recommended phases:

### Phase 1. Freeze Architecture

1. approve this blueprint
2. define manifest standards
3. define dependency rules
4. define workspace-contribution rules

### Phase 2. Classify Current Repo

1. map current modules into engines, shared packages, apps, industry logic, and client logic
2. identify direct cross-app imports that violate the future target
3. identify client-specific logic currently mixed into generic apps

### Phase 3. Introduce Manifests

1. add manifest contracts
2. move route, menu, permission, and workspace contributions into manifests
3. stop adding new hardcoded workspace wiring where manifests should own it

### Phase 4. Separate Industry And Client Logic

1. move reusable vertical behavior into industry packs
2. move client-only behavior into overlays
3. keep generic apps clean and industry-neutral where possible

### Phase 5. Workspace Resolution

1. resolve workspace by client, industry, role, and feature flags
2. reduce hardcoded shell composition
3. make visibility inspectable and supportable

### Phase 6. Repo Reorganization

1. introduce the future folder layout only after contracts are stable
2. migrate modules gradually
3. avoid one-shot repo-wide rewrites

## Near-Term Deliverables

The next architecture batches after this blueprint should define:

1. first manifest inventory mapped onto real current runtime modules
2. permission and feature-flag contracts wired into future manifest contributions
3. visibility-ledger-ready shell-composition migration planning
4. migration backlog ordered by dependency risk
