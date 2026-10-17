# TConnect: Member

Portal registration, member identity, requested association membership, and staff membership review.

## Behavior and access

Registration validates the portal Corporate ID and requires trusted identity provisioning. Member access and staff review use backend authorization. Approval checks the association before linking the company.

Platform supplies authoritative tenant context, activation, and authenticated identity.
Documentation does not grant runtime access.

## Ownership and persistence

The member leaf owns its contracts, persistence, validation, and UI.
Apply its managed tenant migrations before using new tables on an existing database.
No schema migration or production deployment is certified by this reference.

## Source contracts

- `apps/tconnect/api/src/modules/member/index.ts`
- `apps/tconnect/api/src/modules/member/member.lookup.ts`
- `apps/tconnect/api/src/modules/member/member.migration.ts`
- `apps/tconnect/api/src/modules/member/member.module.ts`
- `apps/tconnect/api/src/modules/member/member.repository.ts`
- `apps/tconnect/api/src/modules/member/member.routes.ts`
- `apps/tconnect/api/src/modules/member/member.seed.ts`
- `apps/tconnect/api/src/modules/member/member.service.ts`
- `apps/tconnect/api/src/modules/member/member.types.ts`

## Verification

Run TConnect API/web type checks, lint, builds, and module boundaries from the repository root.
Verify public filtering, denied access, tenant isolation, and retained writes with an authenticated test tenant.
A passing build does not establish live persistence or browser behavior.
