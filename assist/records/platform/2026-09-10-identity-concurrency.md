# Identity concurrency and revocation

## Outcome and ownership

Root candidate 0.1.23 contains Identity API 1.2.0 and schema 1.2.0.
All changes remain inside Platform Identity. Framework and shared UI are unchanged.
This completes P001 concurrency repairs, not full Platform release acceptance.

## Binding properties

Registration inserts the user, all identifiers, and credential in one transaction.
A unique-identifier conflict rolls back the whole registration and returns a safe
conflict error. New email identifiers are not marked verified without a provider.
Existing seed and migration declarations remain unchanged.

Device registration locks the user row before checking existing devices. Only
one concurrent first device becomes active. Repeated device IDs cannot overwrite
their token. Session creation locks the user and device and verifies their state.
Migration 0004 adds `auth_version`; status updates advance it and disable revokes
all sessions in the same transaction. Authentication started before a status
change cannot create a session afterward. Re-enabling does not restore tokens.

Password verification now precedes portal mismatch disclosure. Pending-device
denials create medium-risk login events without passwords or device tokens.

## Verification

- `test:identity`: ten service and portal HTTP tests passed.
- `test:identity:mariadb`: schema fingerprint, simultaneous duplicate registration,
  rollback without orphan records, concurrent first devices, login/disable race,
  disable/enable revocation, stale generation denial, and fresh login passed.
- The database runner removes only its PID-scoped test database and verifies
  removal of its database grant. The configured application database is untouched.
- Platform API typecheck passed.
- Root `npm.cmd run check` passed: layout, versions, documentation, boundaries,
  UI registry, format, lint, typecheck, all 27 workspace builds, and automated
  tooling, Framework, runtime, Orship, Zetro, Platform, Identity, and server tests.
  No build warnings remained. Negative readiness tests emitted expected 503 logs.
- `test:mariadb:foundation` passed migration/restart, schema drift, lock,
  rollback, recovery, and disposable database cleanup checks.
- Desktop 0.1.23 compiled as part of the root build. It was not installed;
  installed desktop 0.1.22 remains running. No Docker deployment was performed.

The installed Zetro review job `5edc557e-86ab-494b-bf87-cc7c7dabe9e7` failed due to
a provider file-path lookup error. It is not review approval. Installed desktop
0.1.22 remains separate from this source release.

## Next gates and references

Product permission denial, dependency failures, public cross-app Identity client,
browser portal acceptance, all-app adoption, and isolated/combined Docker proof
remain open in [P001](../../tasks/platform-first-release.md).
Provider delivery, signing, and production deployment need separate configuration
and approval. See the [module README](../../../apps/platform/api/src/modules/identity/README.md)
and [release workflow](../../operations/stable-release-workflow.md).
