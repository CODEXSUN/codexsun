# T09: Supervisor and parallel workers

Status: planned. Prerequisites: T08. Owner: orchestration worker with integrator support.

## Scope

Implement persisted assignment dependencies, leases, worker heartbeats, bounded dispatch, integration gates, and independent review state.
Use SUPERVISOR-WORKERS.md as the protocol.
Add worker/task inspection UI with actual event-backed status.
Default to at most two concurrent implementation workers.

## Allowed paths

Lease run assignment/scheduling/recovery files, frontend run/task views, and orchestration tests.
Do not change workspace enforcement or provider contracts without a reviewed revision.
The integrator owns shared composition and final combined-revision checks.

## Acceptance

- Two disjoint tasks can complete and integrate with combined verification.
- Overlapping leases, unsatisfied dependencies, stale attempts, and duplicate execution are rejected.
- Worker crash, expiry, cancellation, budget exhaustion, and late results preserve correct state.
- A worker cannot delegate more workers or accept its own completion as independent review.

## Verification and handoff

Run deterministic scheduling tests plus real parallel fixture tasks and fault injection.
Cover E10/E13/E14/E15/E16/E20/E22.
Return dispatch/handoff records, lease and recovery evidence, resource measurements, and templates/HANDOFF.md.
Prove dependency resolution works without nested installs in the selected workspace strategy.
