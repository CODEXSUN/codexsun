# Framework API Boundary And Integration Foundation

## Purpose

This plan defines the first framework-owned HTTP and integration foundation that matches the real `apps/` repository model.

Use this plan when adding:

1. framework-owned API namespaces
2. route policy and request-context contracts
3. API client, token, idempotency, webhook, and request-log tables
4. public docs for framework HTTP and integration behavior

## Goal

Implement a framework-owned API boundary with three clear surfaces:

1. an internal API for first-party apps, desks, and workspace flows
2. an external API for client apps, partner apps, and third-party systems connecting by token
3. a small public API surface for setup, health, and future unauthenticated bootstrap endpoints

This batch must also close the first scaling gaps around API contract ownership, token ownership, request safety, and integration observability without pretending the backend host already exists.

## Scope

- `ASSIST/Execution`
- `ASSIST/Planning`
- `ASSIST/Documentation`
- `apps/framework/src/runtime/http`
- `apps/framework/src/runtime/database`
- `apps/docs/framework`

## Canonical Decisions

- The framework owns API boundary policy, token models, versioning rules, request context, and contract safety.
- Internal API, external API, and public API are separate framework assemblies even when a future host mounts them in one process.
- Internal API is for first-party surfaces only and carries authenticated user context, company membership context, and permission context.
- External API is contract-first, versioned from day one, and accessed through company-bound API clients and scoped tokens.
- Public API stays intentionally small and should not become a bypass around internal or external policy.
- External clients must never reuse first-party user tokens.
- Long-running integration work should resolve through jobs, webhooks, and status resources instead of blocking synchronous routes.
- Shared business services stay behind framework and app modules; route contracts are the outer layer, not the source of truth.
- HTTP contracts, schema contracts, and migration files must stay split by stable logical ownership instead of growing into one mixed file.

## Assumptions

- No real API host exists yet, so this batch should deliver framework contracts and persistence shape first.
- MariaDB remains the durable source for API clients, tokens, scopes, webhook subscriptions, idempotency records, and API audit history.
- PostgreSQL should remain compatible through the same ORM and migration path.
- SQLite should continue to support migration smoke testing and future desktop-safe integration tooling.
- Company isolation is mandatory for both internal and external routes.

## Execution Plan

1. Rewrite this plan so it matches the real `apps/framework` boundary instead of retired `apps/custom/*` or `apps/core/api` assumptions.
2. Define framework API namespaces and contract rules for `/internal/v1`, `/external/v1`, and `/public/v1`.
3. Add framework-owned route policy, request-header, request-context, and route-manifest helpers under `apps/framework/src/runtime/http`.
4. Add ordered schema section files for API clients, API secrets, token scopes, access tokens, token-scope assignment, idempotency keys, webhook subscriptions, webhook deliveries, and API request logs.
5. Add matching ordered migration section files under the platform migration module so the new tables remain grouped but scalable.
6. Extend the platform foundation layer plan to include the API boundary and integration foundation.
7. Publish public framework docs for the HTTP boundary and integration database ownership under `apps/docs/framework`.
8. Validate typecheck, build, migration listing, SQLite smoke migration execution, and repository workflow checks.

## Validation Plan

- Run `npm run typecheck`
- Run `npm run build`
- Run `npm run db:migration:list`
- Run `npm run db:test:migrations`
- Run `npm run db:migrate` and `npm run db:migrate:down` with `DB_CLIENT=sqlite`
- Run `npm run githelper -- check`

## Validation Status

- Passed: framework-specific typecheck, framework build, migration listing, SQLite smoke testing, and SQLite migrate/down validation now pass.
- Blocked: root `npm run typecheck` still fails in the existing `apps/ui` package because that package contains unrelated unresolved Next-specific and strict-type issues outside this batch.

## Risks And Follow-Up

- If internal and external DTOs share the same route layer carelessly, the public contract will drift with backoffice changes.
- External token auth becomes unsafe quickly without rotation history, audit logs, revocation support, and company-bound scopes.
- Rate limiting may need Redis or another fast store later, but the framework should still record policy and breach-friendly data in the database from the first batch.
- Idempotency, request tracing, and webhook retry state are easy to postpone, but skipping them early creates expensive cleanup later once partners integrate.
- The next batch after this contract foundation should add the real backend composition root, live route mounting, secret hashing flow, and contract tests per version.
