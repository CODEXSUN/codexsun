# Orship Agent Skills

## Purpose

Orship is the CODEXSUN orchestration application.

It coordinates a reviewed change from development through preview, verification,
approval, and a live VPS deployment. It records evidence for each step.

Orship does not own product code. The owning application or module keeps its
source, contracts, migrations, tests, and deployment configuration.

## Required Agent Behavior

An Orship agent must do the following.

1. Read the selected deployment profile and the target application README.
2. Read the current task record before it starts an operation.
3. Use provider adapters. Do not call a provider from a UI component.
4. Record the source revision, actor, request, result, and correlation ID.
5. Redact secrets, tokens, cookies, private paths, and environment values.
6. Stop when a required approval, credential, or verified health result is missing.
7. Keep production deployment separate from preview deployment.
8. Report a failed operation with its safe error code and next action.

An agent must not do the following.

- Run arbitrary shell commands on a VPS.
- Print or store a raw provider token.
- Deploy an unreviewed revision to production.
- Treat a queued deployment as a successful deployment.
- Treat a health endpoint as proof of a complete user flow.
- Roll back a database migration without a reviewed rollback procedure.
- Delete a preview, deployment, volume, database, or backup without approval.

## Ownership and Boundaries

```text
Orship API modules
  -> public orchestration contracts
  -> provider adapters
  -> deployment providers and VPS

Orship web
  -> public API contracts
  -> shared @codexsun/ui exports
```

Keep these modules separate.

| Module        | Owns                                                         | Does not own                  |
| ------------- | ------------------------------------------------------------ | ----------------------------- |
| Change intake | Source revision, target, and requested environment           | Product source code           |
| Preview       | Preview request, URL, expiry, and cleanup evidence           | Production promotion          |
| Verification  | Check plan, executions, and attached evidence                | Test implementation           |
| Approval      | Approval request, decision, scope, and expiry                | Credentials or policy bypass  |
| Deployment    | Queued operation, provider result, health, and rollback link | Product runtime configuration |
| Telemetry     | Logs, metrics, traces, alerts, and correlation search        | Provider secrets              |
| VPS inventory | Server capability, resource status, and safe references      | Arbitrary remote execution    |

Each module needs a provider, contracts, service, repository, routes, tests, and
README when it is implemented. Modules communicate through public contracts and
post-commit events.

## Delivery State Model

```text
draft
  -> development-ready
  -> preview-requested
  -> preview-ready
  -> verification-running
  -> verification-passed
  -> approval-requested
  -> approved
  -> production-queued
  -> deploying
  -> live-verified

verification-failed, rejected, deployment-failed, and rolled-back are terminal
states for the active attempt.
```

Only a named approver can move an attempt from `approval-requested` to
`approved`. An approval must name the revision, target, checks, risk, expiry,
and rollback plan. Any change to those fields invalidates the approval.

## Provider Adapter Rules

Use one provider interface for each capability.

| Capability   | Required adapter operations                                    |
| ------------ | -------------------------------------------------------------- |
| Source       | Read revision metadata and pull-request state                  |
| Preview      | Create, read, and remove an isolated preview                   |
| Deployment   | Queue, read status, cancel when supported, and read logs       |
| Runtime      | Read liveness, readiness, release identity, and health details |
| Telemetry    | Query logs, metrics, traces, alert state, and time range       |
| VPS          | Read registered server capability and deployment target status |
| Notification | Send an approval, failure, recovery, or completion notice      |

Adapters validate configuration with Zod. They return typed results and safe
error codes. They do not expose a provider SDK or raw HTTP response to a route.

Store provider credentials in the root `.env` or `apps/orship/.app.env`. Keep
only credential references and redacted metadata in Orship records.

## Preview Pattern

Use a separate preview for each reviewed source revision. A preview has its own
URL, non-production environment values, expiry, and cleanup record.

Use the same safeguards that Vercel and Coolify use for preview deployments.

1. Build or select the exact revision.
2. Create an isolated preview environment.
3. Use preview-only credentials and storage namespaces.
4. Run API, browser, and smoke checks against the preview URL.
5. Attach the check evidence to the orchestration attempt.
6. Remove the preview after expiry or pull-request closure.

Never expose production secrets to previews. Treat code from an external pull
request as untrusted. A preview URL must be access-controlled when it shows
private data.

## VPS Deployment Pattern

Orship supports a VPS through a deployment provider such as Coolify. It must
also support a future direct deployment adapter with the same contract.

1. Validate the selected revision, environment, approval, and rollback plan.
2. Queue one deployment attempt with an idempotency key.
3. Record the provider deployment identifier and operation log reference.
4. Wait for the provider to report completion.
5. Check liveness, protected readiness, and release identity.
6. Run the required live user-flow checks.
7. Mark the revision live only after all checks pass.
8. Start the reviewed rollback action when the release fails.

Use least-privilege deployment credentials. A deploy-only credential may start
the selected deployment. It must not grant general provider administration.

## Monitoring and Metrics Pattern

Collect telemetry with a stable correlation ID across preview, deployment, and
live verification. Use Laravel Nightwatch as a reference for request, job,
command, exception, trace, and notification correlation. Orship remains
vendor-neutral.

For each application target, define the following signals.

| Signal | Minimum fields                                                             |
| ------ | -------------------------------------------------------------------------- |
| Log    | Time, level, application, module, deployment, correlation ID, safe message |
| Metric | Name, value, unit, dimensions, time, and source                            |
| Trace  | Trace ID, span ID, operation, duration, status, and correlation ID         |
| Health | Liveness, readiness, dependency state, release identity, and checked time  |
| Alert  | Rule, threshold, state, target, owner, and notification result             |

Track request rate, error rate, latency percentiles, saturation, restart count,
queue depth, queue age, CPU, memory, disk, and deployment duration. Define each
metric name, unit, source, retention, access policy, and alert threshold before
use.

An alert creates a reviewable incident record. It does not automatically deploy,
rollback, restart, or delete resources without a documented approval policy.

## Required Verification

Every deployment attempt must have these records before it is complete.

1. Source revision and immutable build or image identity.
2. Preview URL or an explicit reason that no preview applies.
3. Static, API, and browser checks required by the target profile.
4. Database migration and backup evidence when data changes.
5. Approval decision for production.
6. Provider deployment result and selected operation logs.
7. Liveness, readiness, release identity, and live user-flow evidence.
8. Rollback readiness or rollback result.

## Implementation Sequence

1. Define public contracts and the orchestration state machine.
2. Build change intake, verification, and approval modules.
3. Build a provider-neutral preview and deployment adapter contract.
4. Add a Coolify VPS adapter behind that contract.
5. Add provider-neutral telemetry, alert, and incident contracts.
6. Build the Orship web workspace from public `@codexsun/ui` exports.
7. Add Playwright flows for review, approval, preview, and live verification.
8. Add Docker and selected VPS deployment checks.

## Reference Documentation

- [Laravel Nightwatch](https://nightwatch.laravel.com/docs/notifications)
- [Vercel deployments](https://vercel.com/docs/deployments/overview)
- [Vercel deployment protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments)
- [Coolify deployment overview](https://coolify.io/docs/applications/deployments/overview)
- [Coolify preview deployments](https://coolify.io/docs/applications/deployments/preview-deployments)
- [Coolify deploy webhooks](https://coolify.io/docs/core/automation/deploy-webhooks)
