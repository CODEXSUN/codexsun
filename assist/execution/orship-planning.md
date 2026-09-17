# Orship Orchestration Plan

## Goal

Build Orship as the CODEXSUN orchestration application.

It must guide a selected revision through development, preview, verification,
manual approval, live VPS deployment, monitoring, and rollback evidence.

## Scope

Orship owns operations records, provider adapters, deployment evidence,
telemetry views, and approval controls.

Orship does not own product source, business rules, product migrations, or
provider secrets.

## Required Outcomes

1. An operator can create a deployment attempt for one immutable revision.
2. The system can create an isolated preview where the target supports it.
3. The system can run and record required verification checks.
4. A named approver can approve or reject one exact production scope.
5. The system can queue a selected VPS deployment through a provider adapter.
6. The system can prove live health and a required user flow.
7. The system can show logs, metrics, traces, alerts, and deployment history.
8. The system can start and record a reviewed rollback operation.

## Exclusions

- Automatic production deployment without a valid approval.
- Arbitrary shell access to a VPS.
- Direct UI access to provider SDKs or credentials.
- Product-specific deployment logic in Orship core.
- Automatic destructive recovery actions.
- A claim that HTTP health alone proves a working release.

## Architecture

```text
Orship web
  -> Orship public API contracts
  -> Orship API modules
  -> provider-neutral ports
  -> source, preview, deployment, telemetry, notification providers
  -> Vercel, Coolify, VPS, or another selected provider
```

The first VPS provider target is Coolify. The first provider adapter must still
use provider-neutral contracts. Vercel patterns guide preview and protection.
Laravel Nightwatch patterns guide correlated observability.

## Phases

### Phase O-1201: Foundation and Contracts

Status: Complete.

Define Orship application ownership, provider manifests, API and web workspace
configuration, and public orchestration contracts.

Acceptance criteria:

- API and web hosts have validated Orship configuration.
- Each first module has a provider, README, and registry entry.
- Contracts define attempts, revisions, targets, check results, approvals, and
  safe error envelopes.
- The state machine rejects invalid transitions.

Verification:

- API and web type checks pass.
- Module boundary checks pass.
- Contract and state-machine tests pass.

### Phase O-1202: Change Intake and Verification

Status: Complete.

Create a revision-bound deployment attempt. Record static, API, browser, and
data checks through a typed verification contract.

Acceptance criteria:

- An attempt contains an immutable revision and selected target.
- A check result includes command or provider reference, time, outcome, and
  safe evidence link.
- A failed required check blocks approval.

Verification:

- Repository and service tests pass.
- A Playwright flow shows the blocked approval state.

### Phase O-1203: Preview Environments

Add a provider-neutral preview port and a first adapter. Use separate preview
configuration, access control, expiry, and cleanup records.

Acceptance criteria:

- Preview creation uses a selected immutable revision.
- Preview values cannot use production credential references.
- Preview checks run against the returned URL.
- Cleanup is reviewable and idempotent.

Verification:

- Adapter contract tests pass.
- A provider sandbox or fixture proves create, read, and cleanup behavior.
- A browser flow verifies a protected preview URL.

### Phase O-1204: Manual Approval

Add approval requests, approval decisions, expiry, and invalidation rules.

Acceptance criteria:

- Only authorized approvers can approve production.
- Approval names the revision, target, required checks, risk, and rollback plan.
- A change in approved scope invalidates the approval.
- Reject and expiry states block deployment.

Verification:

- Authorization and transition tests pass.
- A Playwright flow verifies approval, rejection, expiry, and invalidation.

### Phase O-1205: Coolify VPS Deployment

Implement the first deployment adapter for Coolify. Keep provider-specific
requests inside the adapter.

Acceptance criteria:

- Orship queues a selected deployment with an idempotency key.
- Orship records the provider operation identifier and redacted log reference.
- A queued request does not mark a release as live.
- Failed deployment and health states keep the previous release status clear.

Verification:

- Adapter fixtures cover success, authorization failure, provider failure, and retry.
- A selected non-production VPS target proves queue, completion, and health checks.
- Docker checks pass when the selected profile uses Docker.

### Phase O-1206: Live Verification and Rollback

Verify liveness, readiness, release identity, and a defined user flow. Add a
reviewed rollback record and adapter action.

Acceptance criteria:

- Live status requires all required checks.
- The release identity matches the approved revision or image.
- The rollback action names its target and approval policy.
- The system records rollback outcome and post-rollback health.

Verification:

- Integration tests cover failed verification and rollback requests.
- A controlled target proves an end-to-end deployment and rollback drill.

### Phase O-1207: Observability and Incidents

Add correlated logs, metrics, traces, alerts, and incident records.

Acceptance criteria:

- Each deployment and check has a correlation ID.
- The dashboard shows deployment duration, error rate, latency, saturation, and
  restart state for the selected target.
- Alert rules and notification outcomes are auditable.
- Telemetry never stores raw credentials or sensitive payloads.

Verification:

- Telemetry contract and redaction tests pass.
- A fixture proves alert creation and incident linking.
- A browser flow filters a deployment by correlation ID.

### Phase O-1208: Production Readiness

Complete the selected deployment profile, backup rules, access policy, runbook,
and production acceptance evidence.

Acceptance criteria:

- The profile names applications, providers, storage, data, rollback, and checks.
- Production credentials use an approved secret store.
- Backup restore and rollback drills have recorded evidence.
- Monitoring owners, retention, alerts, and incident contacts are defined.

Verification:

- A production-readiness review approves the profile.
- The selected live deployment passes all documented checks.

## Open Decisions

1. Select the first source provider and pull-request integration.
2. Select the first verification runner and artifact store.
3. Select the telemetry backend and data-retention policy.
4. Define the production approver role and approval expiry.
5. Define the database migration approval and rollback policy.
6. Confirm Coolify version, VPS target, network model, and backup owner.
