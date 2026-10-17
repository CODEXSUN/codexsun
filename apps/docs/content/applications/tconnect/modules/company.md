# TConnect: Company

Company profiles, industry capabilities, public directory identity, and association relationships.

## Behavior and access

Staff publishing uses tconnect.company.manage. Association references must resolve to active records. Public directory results expose published active companies.

Platform supplies authoritative tenant context, activation, and authenticated identity.
Documentation does not grant runtime access.

## Ownership and persistence

The company leaf owns its contracts, persistence, validation, and UI.
Apply its managed tenant migrations before using new tables on an existing database.
No schema migration or production deployment is certified by this reference.

## Source contracts

- `apps/tconnect/api/src/modules/company/company.lookup.ts`
- `apps/tconnect/api/src/modules/company/company.migration.ts`
- `apps/tconnect/api/src/modules/company/company.module.ts`
- `apps/tconnect/api/src/modules/company/company.repository.ts`
- `apps/tconnect/api/src/modules/company/company.routes.ts`
- `apps/tconnect/api/src/modules/company/company.seed.ts`
- `apps/tconnect/api/src/modules/company/company.service.ts`
- `apps/tconnect/api/src/modules/company/company.types.ts`
- `apps/tconnect/api/src/modules/company/index.ts`
- `apps/tconnect/web/src/modules/company/company.card.tsx`
- `apps/tconnect/web/src/modules/company/company.form.tsx`
- `apps/tconnect/web/src/modules/company/company.hooks.ts`
- `apps/tconnect/web/src/modules/company/company.list.tsx`
- `apps/tconnect/web/src/modules/company/company.profile.tsx`
- `apps/tconnect/web/src/modules/company/company.schema.ts`
- `apps/tconnect/web/src/modules/company/company.services.ts`
- `apps/tconnect/web/src/modules/company/company.types.ts`
- `apps/tconnect/web/src/modules/company/company.workspace.tsx`
- `apps/tconnect/web/src/modules/company/index.ts`

## Verification

Run TConnect API/web type checks, lint, builds, and module boundaries from the repository root.
Verify public filtering, denied access, tenant isolation, and retained writes with an authenticated test tenant.
A passing build does not establish live persistence or browser behavior.
