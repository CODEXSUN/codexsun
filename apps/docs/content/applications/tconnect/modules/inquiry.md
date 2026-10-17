# TConnect: Inquiry

Retained buyer enquiries and staff review statuses.

## Behavior and access

Public submission validates consent and an active company. The service limits submissions by email. Staff reads and status changes require separate view and manage permissions.

Platform supplies authoritative tenant context, activation, and authenticated identity.
Documentation does not grant runtime access.

## Ownership and persistence

The inquiry leaf owns its contracts, persistence, validation, and UI.
Apply its managed tenant migrations before using new tables on an existing database.
No schema migration or production deployment is certified by this reference.

## Source contracts

- `apps/tconnect/api/src/modules/inquiry/index.ts`
- `apps/tconnect/api/src/modules/inquiry/inquiry.migration.ts`
- `apps/tconnect/api/src/modules/inquiry/inquiry.module.ts`
- `apps/tconnect/api/src/modules/inquiry/inquiry.repository.ts`
- `apps/tconnect/api/src/modules/inquiry/inquiry.routes.ts`
- `apps/tconnect/api/src/modules/inquiry/inquiry.seed.ts`
- `apps/tconnect/api/src/modules/inquiry/inquiry.service.ts`
- `apps/tconnect/api/src/modules/inquiry/inquiry.types.ts`
- `apps/tconnect/web/src/modules/inquiry/index.ts`
- `apps/tconnect/web/src/modules/inquiry/inquiry.form.tsx`
- `apps/tconnect/web/src/modules/inquiry/inquiry.schema.ts`
- `apps/tconnect/web/src/modules/inquiry/inquiry.types.ts`
- `apps/tconnect/web/src/modules/inquiry/inquiry.workspace.tsx`

## Verification

Run TConnect API/web type checks, lint, builds, and module boundaries from the repository root.
Verify public filtering, denied access, tenant isolation, and retained writes with an authenticated test tenant.
A passing build does not establish live persistence or browser behavior.
