# Observability

## Required signals

Each deployed application emits structured logs, health status, metrics, and trace or correlation identifiers.

Each module emits audit events for security-sensitive and data-changing actions. Audit events must identify the actor, action, target, outcome, and occurred time.

## Health checks

Expose a public liveness check and a protected readiness check. Readiness verifies required dependencies without exposing credentials or internal configuration.

Do not treat an HTTP success alone as end-to-end proof. Verify the affected user flow, worker, storage action, or deployment behavior.

## Logging rules

- Use structured log fields instead of unstructured concatenated messages.
- Include an application, module, environment, and correlation identifier.
- Redact secrets and sensitive personal data.
- Record failures with a safe error code and actionable context.
- Keep retention and access rules in the deployment profile.

## Decision gate

Before production deployment, approve the log store, metrics store, tracing approach, dashboard owner, alert routes, retention period, and incident response owner.
