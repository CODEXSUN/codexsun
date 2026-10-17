# TConnect: Requirement

Buyer sourcing requests and the seller opportunity board.

## Behavior and access

GET /tconnect/requirement lists requests owned by the authenticated buyer. POST and PUT require tconnect.requirement.self, strict input validation, and a transaction that rechecks buyer ownership. GET /tconnect/requirement/board requires tconnect.opportunity.self and seller membership. The owner repository controls publication visibility.

Platform supplies trusted tenant and user context. Documentation never grants permissions.

## Source and verification

The backend lives under `apps/tconnect/api/src/modules/requirement`.
The frontend lives under `apps/tconnect/web/src/modules/requirement`.
Apply the owning managed tenant migrations before enabling new persistence contracts.
Run TConnect API/web type checks, lint, builds, module boundaries, and focused ownership tests.
Verify registration, denied access, and two-account isolation through the configured E2E suites.
Source presence and a passing build do not establish deployed behavior.
