# CODEXSUN personal workspace

Zuno is the assistant identity for this application. The `codexsun` app ID and
folder follow the user's explicit product naming request. Packages and runtime
storage retain the `@codexsun/*` and `codexsun` naming contracts.

## Phase 1: Connected portals

1.1 Register the API and web packages, app launcher, tenant activation, permissions,
and database lifecycle.

1.2 Capture requirements at `/app/codexsun/frontdesk`. Each create request has an
actor-scoped idempotency key. Requirements remain drafts until submitted.

1.3 Organize requirements at `/app/codexsun/workspace`. Save draft creations in
IndexedDB under the current tenant and actor. Replay them with the same key after
checking the live authenticated context. This is an open browser workspace,
not a packaged desktop runner or an offline sign-in system.

1.4 Review requests at `/app/codexsun/approvals`. Approval requires the backend
permission and the current record revision. Approvals are online operations.

1.5 Register portal devices and show their last contact. Device presence does not
grant worker authority. Retried registration does not reactivate inactive devices.

1.6 Verify duplicate replay, actor isolation, stale revisions, revoked access,
activity rollback, device ownership, and cross-account draft protection.

## Phase 2: Worker execution

Before worker execution, verify native device communication.
The Android app is in `mobile`. Socket.IO connects web, desktop portal, and native Android sessions.
Saved-record notifications trigger reloads through the existing permission-controlled REST API.
Messages go only to the same actor in the same tenant.
Notifications carry record identity and revision, not requirement contents.
The server checks current access before each message and periodically checks idle sessions.
The mobile setup and test instructions are in `mobile/README.md`.

2.1 Add task planning with dependencies and an approved requirement revision.

2.2 Add a desktop runner with local durable storage, scoped workspace enrollment,
revocable credentials, and task claims. Keep credentials outside browser storage.

2.3 Add an isolated cloud runner. Connect Codex CLI or SDK through a backend
worker adapter. Install and authenticate the runner explicitly. Chat modes do
not imply command execution.

2.4 Save progress, worker heartbeats, reports, and cancellation state. Reconcile
interrupted runs before retrying. Apply time, cost, and retry limits.

## Phase 3: Zuno conversations and evidence

3.1 Add scoped client conversations and owner clarification tools. Preserve the
existing Super Admin-only Zuno diagnostics and production correction checks.

3.2 Add speech-to-text and configurable text-to-speech. Browser read-aloud is
available where supported in phase 1. Provider credentials remain server-side.

3.3 Add permission-controlled attachments, file size/type limits, and OCR jobs.
Treat extracted document text as untrusted evidence, not execution instructions.

## Phase 4: Verification and delegated acceptance

4.1 Assign independent reviewers and test workers to the submitted commit.

4.2 Run bounded correction cycles. Keep technical acceptance, client acceptance,
merge, and production deployment as separate decisions.

4.3 Add owner mobile notifications and approval interactions. Bind every approval
to its subject version. Never interpret missing replies as approval.

## Phase 5: Domain deployment

5.1 Stage this application on the verified VPS with separate data and development
runner resources. Check authenticated access, persistence, migrations, and backups.

5.2 Identify the exact portfolio route and container serving `codexsun.com`.
Preserve a rollback target before switching the route to the verified portal.

5.3 Replace only that portfolio route/container after the portal health checks pass.
Do not stop unrelated apps, the shared database, or the tunnel.

## Ownership and verification

The requirements leaf owns requirements and their activity. The devices leaf owns
presence and lifecycle activity. Platform injects authenticated tenant database,
actor identity, activation checks, and permissions. It does not own these entities.

Run from the repository root:

```text
npm run typecheck -w @codexsun/codexsun-api
npm run typecheck -w @codexsun/codexsun-web
npm run lint -w @codexsun/codexsun-api
npm run lint -w @codexsun/codexsun-web
node tools/check-module-boundaries.mjs codexsun
npm run test:codexsun
npm run test:e2e:codexsun
npm run dependencies:check
```

Provision the new tracked migrations and seed permissions through the tenant
lifecycle. Enable CODEXSUN through Plan Access and tenant Entitlements. Admin
defaults are seeded without restoring disabled permissions or grants.

Schema rollback requires an explicit data-preserving plan. It must not silently
drop captured requirements or approval history.

Activity migration version 2 upgrades early local databases with the standard
status, actor, and update columns without removing existing history.
