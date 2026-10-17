# TConnect: Community

Association articles, events, announcements, and business opportunities.

## Behavior and access

Staff saves require tconnect.community.manage. Association references must resolve to active records. Public reads exclude inactive posts.

Platform supplies authoritative tenant context, activation, and authenticated identity.
Documentation does not grant runtime access.

## Ownership and persistence

The community leaf owns its contracts, persistence, validation, and UI.
Apply its managed tenant migrations before using new tables on an existing database.
No schema migration or production deployment is certified by this reference.

## Source contracts

- `apps/tconnect/api/src/modules/community/community.migration.ts`
- `apps/tconnect/api/src/modules/community/community.module.ts`
- `apps/tconnect/api/src/modules/community/community.repository.ts`
- `apps/tconnect/api/src/modules/community/community.routes.ts`
- `apps/tconnect/api/src/modules/community/community.seed.ts`
- `apps/tconnect/api/src/modules/community/community.service.ts`
- `apps/tconnect/api/src/modules/community/community.types.ts`
- `apps/tconnect/api/src/modules/community/index.ts`
- `apps/tconnect/web/src/modules/community/community.form.tsx`
- `apps/tconnect/web/src/modules/community/community.hooks.ts`
- `apps/tconnect/web/src/modules/community/community.list.tsx`
- `apps/tconnect/web/src/modules/community/community.page.tsx`
- `apps/tconnect/web/src/modules/community/community.schema.ts`
- `apps/tconnect/web/src/modules/community/community.services.ts`
- `apps/tconnect/web/src/modules/community/community.types.ts`
- `apps/tconnect/web/src/modules/community/community.workspace.tsx`
- `apps/tconnect/web/src/modules/community/index.ts`

## Verification

Run TConnect API/web type checks, lint, builds, and module boundaries from the repository root.
Verify public filtering, denied access, tenant isolation, and retained writes with an authenticated test tenant.
A passing build does not establish live persistence or browser behavior.
