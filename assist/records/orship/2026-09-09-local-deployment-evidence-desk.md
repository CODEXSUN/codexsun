# Orship Local Deployment Evidence Desk

Date: 2026-09-09

## Outcome

The Platform service report now includes a Local Docker Deployment console for the `platform-only` profile. It is an evidence and manual-verification workflow, not an execution channel.

## Binding

- `GET /api/orship/v1/deployments/platform/evidence` reads local Git metadata and relevant source or generated file state.
- `GET /api/orship/v1/deployments/platform/records` returns the private append-only history.
- `POST /api/orship/v1/deployments/platform/records` records operator-provided output as awaiting verification, verified, or failed.
- The console previews Verify, Pull, Prepare, and Deploy commands. It never runs Git pull, Docker Compose, or SSH.
- Common credential, token, password, private-key, and database connection-string patterns are redacted before output is stored.
- The single deployment target keeps Local Docker active by default. A VPS target can be saved but remains inactive.

## Storage

No database was added. Target configuration stays at `storage/app/private/orship/cloud-target.json`. Immutable deployment evidence is appended to `storage/app/private/orship/deployments/platform/records.jsonl`.

## Version

The orchestration module is `1.2.0`. The new public `orship.deployments` contract is `1.0.0`; `orship.services` remains `1.1.0`.

## Verification

- Focused contract, API, and web type checks and production builds are required.
- Browser verification must confirm read-only evidence, command copy, manual status capture, record history, and the absence of browser-run deployment controls.
