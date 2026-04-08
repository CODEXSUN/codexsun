# Phase 8 Stage 8.6: Go-Live Signoff

## Signoff Status

- Status: `blocked`
- Decision date: `2026-04-08`
- Release approval: `not granted yet`

## Gate Status

- `8.1` storefront smoke gate: `passed`
- `8.2` admin operations gate: `passed`
- `8.3` security and operations gate: `passed`
- `8.4` production env and secret checklist: `failed`
- `8.5` ERP integration decision: `transactional bridge enabled`

## Blocking Reason

Go-live signoff cannot be approved yet because the current release-env gate still reports blockers from the active `.env`.

Current blockers:

1. runtime environment is still `development`
2. TLS is disabled
3. app and frontend domains are still local `.local` values
4. `SECRET_OWNER_EMAIL` is missing
5. `OPERATIONS_OWNER_EMAIL` is missing
6. `SECRETS_LAST_ROTATED_AT` is missing
7. Razorpay webhook secret is missing
8. off-machine backup destination is not configured
9. alert delivery targets are not configured

## Owner List

- release owner: `pending`
- rollback owner: `pending`
- secret owner: `pending` until `SECRET_OWNER_EMAIL` is set in the release env
- operations owner: `pending` until `OPERATIONS_OWNER_EMAIL` is set in the release env
- commerce owner: `apps/ecommerce` operator release owner `pending`
- ERP connector owner: `apps/frappe` operator release owner `pending`

## Rollback Plan

### Trigger Conditions

Rollback immediately if any of the following occurs during cutover or immediately after launch:

1. checkout cannot create valid orders
2. payment verification fails consistently
3. customer login or session routing is broken
4. orders are created with incorrect totals or broken states
5. admin cannot view or operate live orders

### Rollback Actions

1. stop new cutover traffic at the proxy or runtime entry point
2. keep the current deployment artifact id and cutover timestamp recorded
3. restore the pre-cutover database backup or approved restore point
4. revert runtime `.env` to the last known-good release values
5. redeploy the prior application build or commit
6. verify health endpoint, admin login, storefront homepage, checkout, and tracking before reopening traffic
7. record the rollback decision, owner, trigger reason, and recovery timestamp

## Approval Rule

This signoff document may be changed from `blocked` to `approved` only when:

1. `npm.cmd run test:release:env` passes against the intended release `.env`
2. named release owner and rollback owner are filled in
3. the final cutover checklist from Phase `1.1` is reviewed and accepted

## Current Decision

Stage `8.6` is recorded, but not complete. The release is not yet approved.
