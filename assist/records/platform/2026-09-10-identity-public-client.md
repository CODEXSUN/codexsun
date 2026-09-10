# Identity public client

## Outcome and ownership

Added the Platform-owned `@codexsun/platform-identity-client` workspace in `apps/platform/contracts`.
Identity API 1.3.0 publishes `identity.access-check` 1.0.0. The database schema remains 1.2.0.
Platform web uses the public client for session reads. Other applications can adopt the same public import without private-source access.
The client owns HTTP transport and validation, not users, credentials, roles, policy, or storage.
Existing uncommitted permission-response fixes and desktop upgrade records were preserved.

## Binding and security

`POST /api/identity[/admin|/sa]/authorize` accepts only `{resource, action}`.
The current session selects the actor. Identity returns `{allowed, userId, portal}` without a permission list or credentials.
The API validates before Fastify can remove unknown body fields. Responses are not cacheable.
Consumers must enforce the result before protected work. This endpoint does not replace product permission declarations.

The client receives an explicit cookie or bearer credential for each call. It never retains tokens or decisions.
Requests use a trusted fixed HTTPS origin, or loopback HTTP for development. Redirects are refused.
The response limit is 64 KiB. The default timeout is five seconds, with caller cancellation support.
Malformed, mismatched, oversized, unavailable, and unauthenticated responses never grant access.
Browser session loading remains portal-isolated. Cross-origin cookie exchange and single sign-on are not implemented.

## Dependencies and workflow

Fastify, Zod, and native fetch implement this step. No new third-party library was needed.
LangGraph is not required for this HTTP contract. Redis and BullMQ remain separate infrastructure decisions for durable background work.
The existing Zetro queue and approval boundaries are unchanged. No autonomous publication or migration was added.
Root scripts, preflight, npm workspace dependencies, and the deployment build list include the new client.
All output remains under root `dist`; installation remains at root `node_modules`.

## Verification and remaining work

Client tests cover concurrent credentials, cookie isolation, permission denial, outages, malformed responses, limits, cancellation, and unsafe origins.
API tests call the public client against Fastify injection and verify allowed/denied decisions, portal isolation, actor injection rejection, and revocation.
These tests do not certify other applications, browser acceptance, or production deployment.
`npm.cmd run check` passed after the Turbo declaration repair: all 28 workspace builds,
types, lint, format, documentation, boundaries, UI ownership, runtime, application, and server tests.
Six client tests and twelve Identity tests passed. Builds emitted no warnings.
Expected negative readiness tests emitted their asserted 503 warnings.
`runtime:validate` passed for seven applications and fourteen components.
Platform-only Compose generation passed. This is generated-plan proof, not a live Docker deployment.
Final documentation formatting and `git diff --check` passed.

Installed Zetro review `d3bd36c1-f15f-4030-bf46-c761092ca8bc` completed with no blocking findings.
It read the exact uncommitted candidate and confirmed request-scoped credentials and fail-closed behavior.
The first attempt `5626d57c-883f-4062-bba2-93f7ee9f5cd8` stopped before provider execution because its new folder was absent from committed HEAD.
The replacement used an existing scope and absolute read-only candidate paths. Neither job approved release or changed source.
The first root gate found the missing workspace Turbo output declaration. The declaration was added before rerunning the gate.

## Performance follow-up

The desktop Turbo output currently includes the entire `dist/apps/zetro/desktop` tree.
Cache handling caused a visible delay after compilation. Review final-artifact staging
and cache granularity separately before changing desktop release output ownership.
The client adds no external packages or background service and does not require a desktop reinstall.

Next: browser portal acceptance, then individual A001 adoption records and R001 Docker verification.
Reference: [public client README](../../../apps/platform/contracts/README.md), [P001](../../tasks/platform-first-release.md),
and [Identity API](../../../apps/platform/api/src/modules/identity/README.md).
