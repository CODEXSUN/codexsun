# Workspace Visibility Matrix

## Purpose

This document defines the future visibility matrix for workspace resolution across:

1. platform mode
2. tenant or client
3. industry pack
4. user workspace profile
5. feature flags

Current runtime note:

1. the first live visibility layer now exists for `industry bundle -> client overlay -> tenant company profile -> cxapp desk app and sidebar group filtering`
2. the current implementation resolves tenant-aware `visibleAppIds` and `visibleModuleIds` through runtime app settings and applies them inside the shared cxapp desk shell
3. workspace-profile permission narrowing, richer feature-flag final overrides, and a full visibility ledger remain future follow-up layers

## Shared Planning Contract

The future planning contract for visibility resolution lives in:

- [workspace-visibility.ts](/E:/Workspace/codexsun/apps/framework/shared/workspace-visibility.ts:1)

That contract describes:

1. `mode`
2. `tenantId`
3. `clientOverlayId`
4. `industryPackId`
5. `workspaceProfile`
6. `enabledApps`
7. `enabledFeatureFlags`

The next-layer planning contracts that sit underneath this visibility model live in:

1. [workspace-permissions.ts](/E:/Workspace/codexsun/apps/framework/shared/workspace-permissions.ts:1)
2. [feature-flag-resolution.ts](/E:/Workspace/codexsun/apps/framework/shared/feature-flag-resolution.ts:1)
3. [visibility-ledger.ts](/E:/Workspace/codexsun/apps/framework/shared/visibility-ledger.ts:1)

## Resolution Inputs

Workspace visibility should resolve from these inputs in order:

1. platform defaults
2. mode: `demo`, `tenant`, or `control-plane`
3. industry-pack defaults
4. client-overlay overrides
5. workspace-profile permissions
6. feature-flag overrides

## Precedence Rules

The resolution order must be deterministic:

1. platform default establishes the baseline surface visibility
2. mode filters the whole environment
3. industry pack enables or hides vertical-specific workspaces
4. client overlay customizes the chosen industry profile
5. workspace profile narrows visibility to what the user should actually operate
6. feature flags make the final enable or disable decision for optional surfaces

Conflict rules:

1. client overlay overrides industry defaults
2. workspace profile overrides generic client visibility when a user should not operate a surface
3. explicit feature-flag disable wins over earlier enables
4. orchestration-only surfaces never appear in normal tenant mode unless explicitly allowed
5. demo mode should never expose sensitive cross-client operational surfaces

## Core Workspace Buckets

For planning, the main workspace buckets are:

1. `shell`
2. `billing`
3. `commerce`
4. `crm`
5. `marketing`
6. `inventory`
7. `documents`
8. `education`
9. `integrations`
10. `support`
11. `orchestration`
12. `accounts-office`

## Mode Matrix

| Mode | Main purpose | Visible workspace classes |
| --- | --- | --- |
| `demo` | sales demos and product walkthroughs | shell, selected business apps, selected industry demos |
| `tenant` | actual client operation | shell, enabled client apps, enabled client reports, enabled client pages |
| `control-plane` | Codexsun internal operations | orchestration, monitoring, support, deployment, accounts-office, selected tenant inspection |

## Industry Matrix

| Industry pack | Core workspaces | Common hidden or reduced surfaces |
| --- | --- | --- |
| `computer-retail` | commerce, billing, inventory, support | education, textile-specific warehouse complexity by default |
| `garment-d2c` | commerce, marketing, billing, support | education, wholesale-focused warehouse operations by default |
| `textile-wholesale` | billing, inventory, documents, support, vendor-facing operations | education, simple retail-only views by default |
| `single-brand-retail` | commerce, billing, marketing | complex wholesale or multi-campus education surfaces |
| `education-campus` | education, billing, documents, support | retail catalog and warehouse-first commerce surfaces |

## Client Matrix

| Client overlay | Industry pack | Primary workspaces | Reduced or hidden workspaces |
| --- | --- | --- | --- |
| `techmedia` | `computer-retail` | commerce, billing, inventory, support | education, textile-wholesale complexity, unrelated multi-client orchestration |
| `tirupurdirect` | `garment-d2c` | commerce, marketing, billing, support | education, wholesale warehouse complexity |
| `thetirupurtextiles` | `textile-wholesale` | inventory, billing, documents, support, vendor workflows | retail-light marketing-only surfaces |
| `horse-club` | `single-brand-retail` | commerce, billing, marketing | multi-warehouse wholesale and education |
| `neot` | `education-campus` | education, billing, documents, support | retail catalog operations, warehouse-led wholesale flows |

## Workspace Profile Matrix

| Workspace profile | Expected visibility |
| --- | --- |
| `super-admin` | all enabled client surfaces plus approved orchestration inspection |
| `admin` | all enabled client business surfaces for that tenant |
| `accounts` | billing, documents, selected reports, accounts-office tasks |
| `sales` | commerce, CRM, customer and order surfaces |
| `warehouse` | inventory, fulfilment, stock movements, selected support |
| `support` | support, customer history, order issue views, selected commerce context |
| `marketing` | marketing, commerce merchandising, campaign and promotion tools |
| `operations` | fulfilment, queue, monitoring, deployment or support depending on mode |
| `teacher` | education teaching surfaces only |
| `student` | student-facing education surfaces only |
| `parent` | parent-facing education surfaces only |

## Codexsun Control-Plane Matrix

Codexsun internal operation should use `control-plane` mode.

| Codexsun internal profile | Visible surfaces |
| --- | --- |
| control-plane super admin | all orchestration, tenant registry, deployment, monitoring, support, backup visibility, accounts-office |
| control-plane operations | monitoring, deployment, health, maintenance, support |
| control-plane accounts office | accounts-office, billing oversight, inter-client billing views, selected support context |
| control-plane demo admin | demo mode setup, sample tenants, sales demo workspaces |

Rules:

1. control-plane users may inspect client state, but client data authority must still respect tenancy and audit boundaries
2. client-facing users must not see cross-client orchestration surfaces
3. demo mode must stay isolated from live client operational data

## Future Runtime Resolution Shape

The current live runtime already covers steps `3`, `4`, `5`, and `6` below through tenant industry profiles, while the broader mode and user-workspace profile layers remain staged.

The eventual runtime should resolve visibility in this order:

1. start with platform-default workspace contributions
2. load mode-based visibility filters
3. apply industry-pack contributions
4. apply client-overlay additions and removals
5. filter by enabled apps for that tenant
6. filter by workspace-profile permissions
7. apply feature-flag final overrides
8. produce an inspectable visibility ledger for support and debugging

## Supportability Rules

Future visibility resolution must be explainable.

Every hidden or visible workspace should be traceable to:

1. platform default
2. industry rule
3. client override
4. role rule
5. feature flag

The detailed planning for those layers now lives in:

1. [PERMISSION_MATRIX.md](/E:/Workspace/codexsun/ASSIST/Documentation/PERMISSION_MATRIX.md)
2. [FEATURE_FLAG_POLICY.md](/E:/Workspace/codexsun/ASSIST/Documentation/FEATURE_FLAG_POLICY.md)
3. [VISIBILITY_LEDGER_DESIGN.md](/E:/Workspace/codexsun/ASSIST/Documentation/VISIBILITY_LEDGER_DESIGN.md)

That means support tooling should eventually be able to answer:

1. why is this workspace visible?
2. why is this workspace hidden?
3. which rule turned it on?
4. which rule turned it off?

## Next Follow-Up

The next architecture batch after this should focus on the first shell-composition migration path from hardcoded workspace menus into manifest-driven resolution.
