# Orship Failure Center

Date: 2026-09-09

## Outcome

Each application report now has a read-only Failures tab. It reads the central failure stream without adding another log owner.

## Binding

- `GET /api/orship/v1/failures` returns the latest normalized failure records.
- Orship contracts own the runtime failure and overview schemas.
- The API accepts ISO and Pino epoch timestamps from private runtime files.
- The web groups records by application and shows severity, component, event, time, and request identifiers.

Orship does not accept browser uploads. A future ingest route needs Identity, rate limits, size limits, and data classification.

## Version

The orchestration module and `orship.services` contract are version `1.1.0`.

## Verification

- Passed Orship API type checking and three module tests.
- Passed Orship web type checking and production build without warnings.
