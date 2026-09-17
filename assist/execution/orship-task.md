# Orship Task Register

Read [orship-planning.md](orship-planning.md) before starting an Orship task.

## Active Work

No Orship task is active.

## Task Rules

1. Start one task only after the user confirms its exact ID.
2. Keep one task inside one named Orship module or composition root.
3. Record data impact, approval need, and required verification before work.
4. Do not add a provider credential or live deployment target without approval.
5. Do not deploy to a live VPS from a planned task.

## Planned Tasks

| Task   | Owner                | Scope                                                     | Data impact | Required verification                                   | State                           |
| ------ | -------------------- | --------------------------------------------------------- | ----------- | ------------------------------------------------------- | ------------------------------- |
| O-1201 | Orship foundation    | Hosts, provider manifests, contracts, and state machine   | No          | API and web checks, contract tests, boundary checks     | Planned. Requires confirmation. |
| O-1202 | Change intake        | Revision-bound attempts and verification evidence         | Yes         | Service tests and blocked-approval browser flow         | Planned. Requires confirmation. |
| O-1203 | Preview module       | Preview port, isolation, expiry, and cleanup              | Yes         | Adapter tests, provider fixture, protected preview flow | Planned. Requires confirmation. |
| O-1204 | Approval module      | Manual approval, expiry, rejection, and invalidation      | Yes         | Authorization, transition, and browser tests            | Planned. Requires confirmation. |
| O-1205 | Deployment module    | Coolify VPS adapter and queued deployment evidence        | Yes         | Adapter tests and non-production VPS deployment         | Planned. Requires confirmation. |
| O-1206 | Release verification | Live checks, release identity, rollback record, and drill | Yes         | Integration tests and controlled rollback drill         | Planned. Requires confirmation. |
| O-1207 | Telemetry module     | Logs, metrics, traces, alerts, and incidents              | Yes         | Redaction tests, telemetry fixture, browser filtering   | Planned. Requires confirmation. |
| O-1208 | Production profile   | Deployment profile, runbook, backup, and production gate  | Yes         | Readiness review and selected live deployment evidence  | Planned. Requires confirmation. |

## Task Completion Rule

Mark a task complete only after its acceptance criteria and required verification
in [orship-planning.md](orship-planning.md) pass. Record the evidence, risks,
and untested paths in the active changelog entry.
