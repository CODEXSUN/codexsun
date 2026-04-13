# Feature Flag Policy

## Purpose

This document defines the future feature-flag resolution policy for the modular ERP target.

Feature flags should control optional or staged behavior without requiring app forks.

This is a planning document only. It does not mean the current runtime already resolves flags this way.

## Shared Planning Contract

The future planning contract for flag resolution lives in:

- [feature-flag-resolution.ts](/E:/Workspace/codexsun/apps/framework/shared/feature-flag-resolution.ts:1)

That contract defines:

1. supported flag scopes
2. per-scope assignments
3. resolution input shape
4. final decision records

## Flag Scopes

Future flag scopes should resolve in this order:

1. `platform`
2. `mode`
3. `industry`
4. `client`
5. `role`
6. `environment`

Rules:

1. the module that owns a feature declares the flag
2. higher-specificity scopes may override broader scopes
3. environment rules are the last operational safeguard and may disable risky features regardless of earlier enablement

## Flag Values

Assignments should support three values:

1. `inherit`
2. `enabled`
3. `disabled`

Why:

1. `inherit` avoids forcing every layer to restate a default
2. `enabled` allows a more specific layer to opt in
3. `disabled` allows a more specific layer or environment to block a feature cleanly

## Resolution Order

Flag resolution should be deterministic:

1. module default from the owning manifest
2. platform-wide assignment
3. mode assignment
4. industry-pack assignment
5. client-overlay assignment
6. workspace-profile assignment
7. environment assignment

Conflict rules:

1. later more-specific assignment overrides earlier assignment
2. `disabled` wins over an earlier `enabled`
3. environment `disabled` is final
4. a missing assignment means `inherit`, not implicit enable

## Flag Categories

Flags should be used for:

1. staged features
2. optional modules or sub-surfaces
3. industry-specific capability enablement
4. client-specific workflow toggles
5. operational safeguards for high-risk features

Flags should not be used for:

1. permanent ownership boundaries
2. core auth or tenant-isolation guarantees
3. secrets or credential storage
4. ad hoc invisible business logic with no support explanation

## Recommended Naming

Future flags should stay readable and ownership-scoped:

1. `ecommerce.storefront-designer.publish`
2. `billing.multi-rate-gst`
3. `frappe.sales-order-push.retry`
4. `education.parent-portal.assignments`
5. `orchestration.remote-update`

Rules:

1. prefix with the owning module or app
2. keep the noun or capability obvious
3. avoid client names in the flag key; client specificity belongs in assignments, not key naming

## Example Resolution Patterns

### Example 1: Industry enablement

1. module default: `disabled`
2. `education-campus` industry assignment: `enabled`
3. client overlay inherits
4. final result for education tenants: enabled

### Example 2: Client restriction

1. module default: `enabled`
2. industry assignment: inherit
3. client overlay assignment: `disabled`
4. final result for that client: disabled

### Example 3: Environment safety block

1. module default: `enabled`
2. client assignment: `enabled`
3. environment assignment for `production`: `disabled`
4. final result in production: disabled

## Relationship To Workspace Visibility

Feature flags are the final visibility modifier after:

1. platform defaults
2. mode
3. industry pack
4. client overlay
5. enabled apps
6. workspace profile

That means flags should not replace the broader visibility model. They should refine it.

## Supportability Rules

Every resolved flag should eventually be inspectable.

Support tooling should be able to answer:

1. what is the final value?
2. which scope supplied it?
3. which subject id supplied it?
4. why was it enabled or disabled?

That final audit trail is part of the future visibility ledger design.
