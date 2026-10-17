# TConnect: Association

Association identity, branding, publication status, and member-company relationships.

## Behavior and access

Staff saves require tconnect.association.manage. Public reads expose active records. Suspension checks active dependent companies and community posts.

Platform supplies authoritative tenant context, activation, and authenticated identity.
Documentation does not grant runtime access.

## Ownership and persistence

The association leaf owns its contracts, persistence, validation, and UI.
Apply its managed tenant migrations before using new tables on an existing database.
No schema migration or production deployment is certified by this reference.

## Source contracts

- `apps/tconnect/api/src/modules/association/association.lookup.ts`
- `apps/tconnect/api/src/modules/association/association.migration.ts`
- `apps/tconnect/api/src/modules/association/association.module.ts`
- `apps/tconnect/api/src/modules/association/association.repository.ts`
- `apps/tconnect/api/src/modules/association/association.routes.ts`
- `apps/tconnect/api/src/modules/association/association.seed.ts`
- `apps/tconnect/api/src/modules/association/association.service.ts`
- `apps/tconnect/api/src/modules/association/association.types.ts`
- `apps/tconnect/api/src/modules/association/index.ts`
- `apps/tconnect/web/src/modules/association/association.form.tsx`
- `apps/tconnect/web/src/modules/association/association.hooks.ts`
- `apps/tconnect/web/src/modules/association/association.list.tsx`
- `apps/tconnect/web/src/modules/association/association.page.tsx`
- `apps/tconnect/web/src/modules/association/association.schema.ts`
- `apps/tconnect/web/src/modules/association/association.services.ts`
- `apps/tconnect/web/src/modules/association/association.types.ts`
- `apps/tconnect/web/src/modules/association/association.workspace.tsx`
- `apps/tconnect/web/src/modules/association/index.ts`

## Verification

Run TConnect API/web type checks, lint, builds, and module boundaries from the repository root.
Verify public filtering, denied access, tenant isolation, and retained writes with an authenticated test tenant.
A passing build does not establish live persistence or browser behavior.
