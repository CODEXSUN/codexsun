# P001 Platform first release

## Status and ownership

In progress on the `0.1.23` candidate. F001 technical checks passed;
stable release approval remains separate. Platform Identity owns authentication
and authorization. Platform Core owns neutral runtime contracts, not user tables.

## Completed binding repair

Actor resolution and activity logging now use the same module-owned request
session resolver. Identity routes use its token parser. Explicit Authorization
headers never fall back to cookies. Bearer scheme matching is case-insensitive.
Session resolution checks the current user's portal as well as the stored session.
See the [development record](../records/platform/2026-09-10-identity-session-binding.md).

## Remaining stages

1. Completed: product permission-denial and session/permission dependency-failure
   HTTP tests pass for cookies and bearer tokens. Platform maps policy denial to
   403, not 500. See the [record](../records/platform/2026-09-10-identity-permission-http.md).
   Browser login and native-client UI remain unverified.
2. Completed: permanent disable revocation, authentication generation checks,
   atomic registration, and serialized first-device activation. Disposable
   MariaDB regression tests pass. See the [record](../records/platform/2026-09-10-identity-concurrency.md).
3. Completed: password verification precedes portal disclosure, and pending-device
   denials create safe audit events. Service regression tests pass.
4. Completed in source: public Identity client and permission-check protocol.
   Platform web consumes session reads. Client/API negative tests pass.
   See the [record](../records/platform/2026-09-10-identity-public-client.md).
   Other application adoption remains an A001 gate, not an inferred pass.
5. Browser repair pass: super-admin login, refresh, logout, and denial on other desks passed.
   Fixed browser fetch invocation, profile logout, identifier input, and registration visibility.
   See the [browser record](../records/platform/2026-09-10-identity-browser-acceptance.md).
   Positive regular/admin credential flows and device activation UI remain open.
   Cookie and native bearer HTTP regression tests pass, not native-client UI acceptance.
6. Create A001 evidence for each selected catalog application, then run R001
   isolated and combined Docker gates. Catalog presence alone is not adoption.

These are unresolved acceptance items, not completed features. Each stage needs
an owned patch, regression tests, and an updated record before the next stage.
Email/OTP and password-reset delivery remain unavailable without owned providers.

## Next fixture task

0.1.30 adds the reviewed test-only bootstrap and safety tests.
See the [experiment record](../records/platform/2026-09-10-p001-fixture-experiment.md).
The originating Zetro job failed inspection commands. The supervisor corrected its candidate patch.
Live database provisioning, isolated origins, browser scenarios, and cleanup remain pending.

Zetro completed read-only fixture planning in job `5db6e77f-b7f8-468f-8063-55f282f9c6a0`.
Use the supervisor corrections in the [0.1.24 record](../records/zetro/2026-09-10-desktop-0.1.24.md).
Build Identity-owned test bootstrap support for a disposable database and three portal accounts.
Use one isolated API and one web origin with separate browser contexts. Reserve unused 6000-series ports through preflight.
Never reuse the proposed 6110 port or add a production fixture-creation endpoint.
Positive portal flows and first/later-device activation must pass before this stage can close.

## Concept development readiness

Zetro can receive scoped review/development jobs and run trusted named scripts.
It is not an autonomous release approver. New concepts must declare their owner,
public contracts, schema/migration plan, selected shared UI blocks, tests, and
required approvals before implementation. A failed or unverified upstream gate
blocks automatic progression. Do not generate generic centralized business CRUD.

Use the [release workflow](../operations/stable-release-workflow.md) for commands,
approval boundaries, and evidence requirements. Production migration, destructive
cleanup, publication, and deployment still require user approval.
