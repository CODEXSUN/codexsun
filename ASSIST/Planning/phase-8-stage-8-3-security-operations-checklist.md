# Phase 8 Stage 8.3: Security And Operations Checklist

## Goal

Make the release gate explicit for the operational controls that must be working before go-live:

- monitoring and alert visibility
- database backup execution
- restore-drill coverage
- security review workflow

## Dedicated Command

- `npm.cmd run test:release:security-ops`

## Covered Runtime Path

The gate reuses the existing strongest checks:

1. internal framework route coverage for monitoring dashboard, backup dashboard, backup run, and security review flows
2. admin-shell page coverage for `Data Backup` and `Security Review`

## Acceptance Rule

Stage `8.3` passes only when the dedicated release-ops command succeeds without manual database edits or bypassed authentication.

## Boundaries

- this gate proves the operational control plane is reachable and functional at route and admin-workspace level
- it does not replace deeper service coverage for lockout, audit logging, or observability internals already landed in earlier stages
- production recipient wiring such as real alert email inboxes or off-machine backup destinations still belongs to the environment checklist in `8.4`
