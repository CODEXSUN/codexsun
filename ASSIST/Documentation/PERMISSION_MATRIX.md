# Permission Matrix

## Purpose

This document defines the future permission model that should sit underneath the workspace visibility matrix.

Visibility answers "can this surface appear?"

Permissions answer "what may this user do on that surface?"

This is still a planning document only. It does not mean the current runtime has already migrated to this matrix.

## Shared Planning Contract

The future planning contract for workspace permission resolution lives in:

- [workspace-permissions.ts](/E:/Workspace/codexsun/apps/framework/shared/workspace-permissions.ts:1)

That contract defines:

1. permission scope types
2. allowed permission actions
3. workspace and control-plane profiles
4. matrix entries by resource, action set, and source

## Permission Layers

Future permission resolution should be applied in this order:

1. platform default resource definitions
2. industry-pack defaults
3. client-overlay restrictions or additions
4. workspace-profile action rules
5. control-plane policy where the mode is internal Codexsun operations
6. feature-flag and runtime-policy final blockers

Rules:

1. visibility alone must not grant write capability
2. `view` is the minimum action required for any visible business surface
3. `manage` must be treated as a superset shortcut and should not be granted broadly
4. destructive or externalized actions such as `delete`, `publish`, `approve`, `sync`, and `export` should be explicit even when `update` is allowed

## Scope Types

Permission scopes should align with the current auth metadata vocabulary:

1. `desk`
2. `workspace`
3. `module`
4. `page`
5. `report`
6. `action`

## Action Types

The planning action vocabulary should stay aligned to the current auth metadata:

1. `view`
2. `manage`
3. `create`
4. `update`
5. `delete`
6. `export`
7. `print`
8. `approve`
9. `publish`
10. `sync`

## Tenant Workspace Profile Matrix

| Workspace profile | Typical scope | Typical action posture |
| --- | --- | --- |
| `super-admin` | all enabled tenant workspaces | broad `manage`, plus `approve`, `publish`, and `sync` where the module supports it |
| `admin` | all enabled tenant business surfaces | broad `view`, `create`, `update`, `export`, and selective `approve` |
| `accounts` | billing, reports, documents, selected accounts-office views | `view`, `create`, `update`, `export`, `print`, and selective `approve` |
| `sales` | commerce, CRM, customer-facing operations | `view`, `create`, `update`, `print`, and limited `export` |
| `warehouse` | inventory, fulfilment, stock movement | `view`, `create`, `update`, `print`, and selective `approve` |
| `support` | support, customer history, order issue flows | `view`, `create`, `update`, and limited `export` |
| `marketing` | marketing, merchandising, promotions | `view`, `create`, `update`, `publish`, and limited `export` |
| `operations` | monitoring, queues, fulfilment, selected maintenance | `view`, `update`, `approve`, `sync`, and selective `manage` |
| `teacher` | education teaching surfaces only | `view`, `create`, `update`, and `print` for education records |
| `student` | student-facing education surfaces only | mostly `view`, with limited `create` or `update` on self-service records |
| `parent` | parent-facing education surfaces only | mostly `view`, with limited `update` on approvals or responses |

## Control-Plane Profile Matrix

| Control-plane profile | Main surfaces | Typical action posture |
| --- | --- | --- |
| `control-plane-super-admin` | full orchestration, tenant registry, deployment, support, monitoring, accounts-office | full `manage` plus explicit `approve`, `publish`, and `sync` |
| `control-plane-operations` | deployment, runtime health, update control, diagnostics, support | `view`, `update`, `sync`, and selective `approve` |
| `control-plane-accounts` | cross-client accounts-office and billing oversight | `view`, `create`, `update`, `export`, `print`, and selective `approve` |
| `control-plane-demo-admin` | demo tenants, demo workspace presets, sales demos | `view`, `create`, `update`, `publish`, and limited `manage` |

Rules:

1. control-plane users may inspect tenant state only through audited support or orchestration surfaces
2. control-plane permissions must not silently grant direct tenant business writes unless the operation is explicitly modeled
3. normal tenant profiles must never inherit cross-client permissions

## Resource Families

For planning, permissions should eventually resolve over these resource families:

1. shell and desk surfaces
2. app workspaces
3. modules inside workspaces
4. routed pages
5. reports and exports
6. actions such as publish, sync, restore, or deploy

Examples:

1. `framework.media-manager` should usually require `page:view`, while media deletion should require `action:delete`
2. `ecommerce.storefront-designer` may be visible to marketers, but `publish` should stay restricted
3. `frappe.sync` should require explicit `sync`, not just `update`
4. `billing.reports` may allow `view` and `export` for accounts without granting `manage`

## Resolution Rules

Future runtime permission resolution should follow these rules:

1. a hidden workspace contributes no effective actions
2. explicit deny at client-overlay or runtime-policy level wins over inherited allow
3. `manage` should expand only within the same resource boundary; it must not imply cross-tenant access
4. action grants should be explainable in the future visibility ledger and support tooling

## Relationship To Visibility

The workspace visibility matrix decides which surfaces are candidates to render.

The permission matrix then decides:

1. read-only versus editable
2. which buttons or routes are enabled
3. which destructive or publishing operations are blocked
4. which reports may be exported or printed

## Follow-Up

The future runtime implementation should eventually:

1. bind manifest-declared resources to permission matrix entries
2. expose effective permissions in support and debug tooling
3. enforce action-level checks consistently across UI and backend routes
