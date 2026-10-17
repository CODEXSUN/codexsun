# TConnect: Buyer

Buyer registration and signed-session account mapping.

## Behavior and access

POST /public/tconnect/buyer/registration validates the portal Corporate ID and uses the injected Platform buyer identity capability. Registration writes and activity share a transaction. GET /tconnect/buyer/session requires tconnect.buyer.self and an active buyer identity without seller membership. Browser input cannot choose a role or existing account.

Platform supplies trusted tenant and user context. Documentation never grants permissions.

## Source and verification

The backend lives under `apps/tconnect/api/src/modules/buyer`.
The frontend lives under `apps/tconnect/web/src/modules/buyer`.
Apply the owning managed tenant migrations before enabling new persistence contracts.
Run TConnect API/web type checks, lint, builds, module boundaries, and focused ownership tests.
Verify registration, denied access, and two-account isolation through the configured E2E suites.
Source presence and a passing build do not establish deployed behavior.
