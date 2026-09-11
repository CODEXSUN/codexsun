# Stable release workflow

## Goal and status

Release the smallest verified foundation before product expansion.
Use repository scripts for deterministic checks. An agent answer is not release evidence.

The baseline is commit `1a18b7e`, repository version `0.1.18`.
Historical Zetro desktop evidence does not certify the frontend-only 2.0 application.
No stage below is approved as stable yet.
F001 candidate `0.1.20` has completed technical verification through Zetro review and repository gates.
The [task record](../tasks/framework-first-release.md) separates this result from stable release approval.

## Ordered gates

| Task | Owner                               | Depends on                   | Required outcome                                                                       |
| ---- | ----------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| F001 | Framework                           | Reviewed baseline            | Kernel contracts, lifecycle failures, concurrency, and consumer compatibility verified |
| P001 | Platform Core and Platform Identity | F001 accepted                | Runtime, MariaDB, identity policies, and portal E2E verified                           |
| A001 | Each selected application           | P001 accepted                | Public runtime and identity bindings plus shared UI adoption verified                  |
| R001 | Release supervisor                  | Every selected A001 accepted | Isolated Docker profiles, combined stack, recovery, and release approval verified      |

Do not run a dependent implementation while its upstream public contract remains under repair.
Read-only discovery can run in parallel. Changes require separate file owners and isolated worktrees.
Do not merge shared changes until every affected consumer passes its checks.

## Binding map

| Provider          | Public binding                                                            | Consumer responsibility                                                     |
| ----------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Framework         | `@codexsun/framework` manifests, plans, lifecycle                         | Declare compatible dependencies and explicit composition                    |
| Platform Core API | `@codexsun/platform-core-api` context, health, configuration, diagnostics | Supply application-owned adapters and deny-by-default policy                |
| Platform Core web | `@codexsun/platform-core-web` route and navigation contributions          | Own routes, loading states, and application data                            |
| Platform Identity | Documented HTTP contracts, then a reviewed public client contract         | Resolve sessions and enforce product permissions at the API                 |
| Shared UI         | Public `@codexsun/ui` exports                                             | Supply business fields, validation, callbacks, and screen composition       |
| Runtime holder    | `.container/catalog.json` and versioned profiles                          | Declare packages, components, dependencies, ports, health, and output paths |

Identity tables, passwords, roles, and security events remain Platform Identity-owned.
Do not import private Platform source into another application.
Do not share browser tokens through localStorage across applications.
Cross-origin session exchange needs an explicit identity contract and negative security tests.
Desktop supervisor tokens remain separate from end-user identity.
Document local-only or static-only application exceptions. Do not silently disable authentication for adoption.

## Deterministic commands

- `npm.cmd run check:release:framework` checks the kernel and its declared boundaries.
- `npm.cmd run check:release:platform` checks runtime composition, identity, and server lifecycle.
- `npm.cmd run check:release:adoption` runs the complete source and consumer gate.

These commands validate candidates. They never approve, version, commit, push, or deploy.
Formatting checks do not rewrite parallel work. Repair formatting only inside the assigned scope.
Build dependencies remain in the existing root scripts and Turbo graph.
Do not run several build gates against the same root `dist` concurrently.

Live database and profile checks remain separate because they need owned infrastructure:

```powershell
npm.cmd run test:mariadb:foundation
npm.cmd run runtime:smoke -- platform-only
npm.cmd run runtime:validate
npm.cmd run runtime:compose -- platform-only
```

Never replace an unrelated listener to make a smoke test pass.
Record command, source revision, dirty state, time, exit code, and evidence path for every gate.
Changed inputs invalidate earlier evidence. A skipped gate is not a pass.

## Zetro status

Zetro 2.0 is currently a frontend-only shell. It has no execution, supervision,
verification, desktop, CLI, or release behavior. Use repository-owned scripts
directly until a reviewed Zetro workflow contract is implemented.

## Approval boundaries

The supervisor reviews plans, ownership, patches, tests, and evidence.
The user approves public contract breaks, production migration, destructive cleanup, remote publication, and deployment.
`approved: true` is caller attestation, not a separate enforced human approval inbox.
Do not describe the frontend-only Zetro shell as a release controller.
No automatic merge, commit, push, version bump, production migration, or deployment occurs in this workflow.

## P001 acceptance

Track implementation and unresolved blockers in the [P001 task](../tasks/platform-first-release.md).

- Liveness works during dependency failure. Readiness fails closed.
- SIGTERM, SIGINT, and IPC shutdown release owned ports and resources.
- Isolated MariaDB install, restart, forward migration, immutable checksum, drift, lock, and recovery tests pass.
- `/login`, `/admin/login`, and `/sa/login` remain isolated.
- Unknown, invalid, expired, revoked, disabled-user, and pending-device sessions are denied.
- Username, email, and mobile login retain the eight-character password minimum.
- Only super administrators can inspect all-user security activity.
- Administrators manage permitted users and roles without credential access.
- Cookie and bearer clients enforce equivalent authorization at the API.
- Optional email/OTP and password-reset delivery remain visibly unavailable until implemented and tested.
- Browser tests prove login, refresh, logout, permission denial, and device activation.

## A001 acceptance per application

Discover the current application list from the deployment catalog, not a copied list.
Create one adoption record per selected application with the following fields:

`application`, `revision`, `runtimeBindings`, `identityPolicy`, `permissions`,
`uiImports`, `migrationOwner`, `profile`, `checks`, `browserEvidence`, `exceptions`, `reviewer`.

Verify unauthenticated denial, allowed access, forbidden access, expiry, revocation, and dependency outage.
Verify shared UI imports, document title, navigation, loading, empty, error, and keyboard states.
Verify API and web startup, shutdown, ports, logs, and root-dist output independently.
Do not mark catalog registration or a UI import audit as proof of identity adoption.

## R001 E2E and stable approval

1. Build a clean reviewed commit using the repository-owned version helper.
2. Build each selected isolated Docker profile.
3. Check image contents, health, migrations, logs, restart, persistence, and shutdown.
4. Prove omitted applications leave no final image artifacts.
5. Test the combined profile only after isolated profiles pass.
6. Test backup restore and forward recovery against disposable data.
7. Record installer signing and upgrade evidence when desktop is included.
8. Obtain user approval before publication or live deployment.
9. Record the release commit, artifact hashes, profile version, and verified checks.

Any unexplained warning, failure, stale evidence, or missing required check blocks stable approval.
Expected failures in negative tests must have explicit assertions and must not leak into live readiness.

## First task and records

- [F001 framework release task](../tasks/framework-first-release.md)
- [Workflow development record](../records/zetro/2026-09-10-stable-release-workflow.md)
