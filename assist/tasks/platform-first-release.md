# P001 Platform first release

## Status and ownership

In progress on the uncommitted `0.1.20` candidate. F001 technical checks passed;
stable release approval remains separate. Platform Identity owns authentication
and authorization. Platform Core owns neutral runtime contracts, not user tables.

## Completed binding repair

Actor resolution and activity logging now use the same module-owned request
session resolver. Identity routes use its token parser. Explicit Authorization
headers never fall back to cookies. Bearer scheme matching is case-insensitive.
Session resolution checks the current user's portal as well as the stored session.
See the [development record](../records/platform/2026-09-10-identity-session-binding.md).

## Remaining stages

1. Extend the passing portal HTTP session tests to product permission denial and
   dependency failure. Browser login and native-client UI remain unverified.
2. Make user disable revoke existing sessions permanently. Test disable/enable
   and concurrent login against disposable MariaDB data.
3. Make registration identifiers atomic. Test duplicate concurrent registration
   and simultaneous first-device activation. Do not use process-local locks as
   a substitute for database isolation.
4. Remove portal-discovery differences before password verification. Record
   pending-device denials without returning secrets in activity logs.
5. Define and verify the public cross-application identity client contract.
   Do not share private source, user tables, or browser localStorage tokens.
6. Prove the three portal flows in a browser and native bearer HTTP tests.
7. Create A001 evidence for each selected catalog application, then run R001
   isolated and combined Docker gates. Catalog presence alone is not adoption.

These are unresolved acceptance items, not completed features. Each stage needs
an owned patch, regression tests, and an updated record before the next stage.
Email/OTP and password-reset delivery remain unavailable without owned providers.

## Concept development readiness

Zetro can receive scoped review/development jobs and run trusted named scripts.
It is not an autonomous release approver. New concepts must declare their owner,
public contracts, schema/migration plan, selected shared UI blocks, tests, and
required approvals before implementation. A failed or unverified upstream gate
blocks automatic progression. Do not generate generic centralized business CRUD.

Use the [release workflow](../operations/stable-release-workflow.md) for commands,
approval boundaries, and evidence requirements. Production migration, destructive
cleanup, publication, and deployment still require user approval.
