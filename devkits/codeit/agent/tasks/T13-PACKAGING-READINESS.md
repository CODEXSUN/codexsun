# T13: Packaging and release readiness

Status: planned. Prerequisites: T12. Owner: release reviewer/integrator.

## Scope

Prepare a reproducible local product package, startup/readiness contract, private storage paths, migrations, backup, and restore instructions.
Verify installation on a clean target without development source paths or an attached `npm run dev` session.
Keep version bump, signing, publication, and deployment outside this packet unless explicitly authorized.

## Allowed paths

The integrator leases Codeit packaging/startup configuration and required root build tooling.
Use root `dist` only. Read affected tools/component documents before edits.
No installer, deployment, or release action is authorized by this planning file.

## Acceptance

- Packaged web/API/runner behavior passes E26 and standalone readiness checks.
- Fresh install, retained-data upgrade, private storage permissions, backup integrity, and restore-sandbox checks pass E23.
- Critical permission, isolation, cancellation, recovery, and secret tests pass on the packaged product.
- Known limits, supported hosts/providers, rollback boundaries, and unverified external adapters are documented.

## Verification and handoff

Run packaged smoke and applicable E2E tests on a clean Windows test target.
Record package hashes, exact source revision, commands, test evidence, and independent review.
Return a release-readiness result, not a deployment claim.
Stop at the user's actual release boundary and request only missing authorization for the concrete next action.
