# Orship Orchestration Module

Owner: Orship API.

This module owns orchestration state, revision-bound attempts, and verification
check records. It stores records in `private/orship/change-intake/attempts.json`
through the Platform Core storage provider.

Public routes:

- `GET /api/v1/orship/health`
- `GET /api/v1/orship/modules`
- `GET /api/v1/orship/attempts`
- `POST /api/v1/orship/attempts`
- `POST /api/v1/orship/attempts/:attemptId/checks`
- `POST /api/v1/orship/attempts/:attemptId/approval-request`

The provider ID is `orship.orchestration`. It depends on `platform.core` and
uses the Framework provider lifecycle through Platform Core composition.

The module cannot call a deployment provider. A required failed check blocks an
approval request.
