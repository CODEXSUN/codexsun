# Stable release workflow

## Goal and status

Release the smallest verified foundation before product expansion.
Use Zetro for assignment, agent review, durable task history, and supervised repairs.
Use repository scripts for deterministic checks. An agent answer is not release evidence.

The baseline is commit `1a18b7e`, repository version `0.1.18`.
The installed desktop passed a read-only provider smoke. This does not certify all applications.
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

| Provider              | Public binding                                                            | Consumer responsibility                                                     |
| --------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Framework             | `@codexsun/framework` manifests, plans, lifecycle                         | Declare compatible dependencies and explicit composition                    |
| Platform Core API     | `@codexsun/platform-core-api` context, health, configuration, diagnostics | Supply application-owned adapters and deny-by-default policy                |
| Platform Core web     | `@codexsun/platform-core-web` route and navigation contributions          | Own routes, loading states, and application data                            |
| Platform Identity     | Documented HTTP contracts, then a reviewed public client contract         | Resolve sessions and enforce product permissions at the API                 |
| Shared UI             | Public `@codexsun/ui` exports                                             | Supply business fields, validation, callbacks, and screen composition       |
| Runtime holder        | `.container/catalog.json` and versioned profiles                          | Declare packages, components, dependencies, ports, health, and output paths |
| Zetro Supervisor      | `/api/v1/supervisor/jobs`                                                 | Submit a reviewed scope and keep the durable task ID                        |
| Zetro Developer Tools | Repository script System Tasks                                            | Require repository trust and execute named root scripts                     |

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
Zetro Automation discovers these `check:*` scripts from the connected repository.
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

## Zetro flow

1. Connect the repository and verify the Codex account.
2. Start the installed desktop through the CLI `desktop-session` launcher.
3. Confirm readiness and supervisor capabilities without printing the pairing token.
4. Assign the task card with a precise package or module scope.
5. Submit one approved job and record its task and conversation IDs.
6. Inspect task status, tool failures, answer, and isolated worktree changes.
7. Review each proposed patch before integrating it into the shared checkout.
8. Run deterministic checks through trusted repository script tasks.
9. Compare the resulting evidence with the acceptance checklist.
10. Update the task record and owner documentation before advancing.

Use the [CLI contract](../../apps/zetro/cli/README.md) for pairing and job commands.
Provider worktrees start from committed HEAD. They do not include uncommitted checkout work.
Do not install duplicate dependencies in every worktree. Define dependency staging before allowing worktree build jobs.
For the current review workflow, run checks in the trusted dependency-ready primary checkout at the same source commit.
Keep conversation worktrees source-only. Never link mutable workspace packages or caches between concurrent checkouts.
Resolve the Git root before reading AGENTS.md. An application-scoped working directory is not the repository root.
Verify installed executable metadata separately from package versions. See the [verification prompt](../tasks/zetro-stability-verification.md).
The installed desktop does not acquire source changes until a new desktop build is installed.
Current supervisor jobs have a bounded provider turn. Split large reviews into small tasks if that limit is reached.
Never automatically retry an interrupted coding task. Inspect its worktree first.

## Approval boundaries

The supervisor reviews plans, ownership, patches, tests, and evidence.
The user approves public contract breaks, production migration, destructive cleanup, remote publication, and deployment.
`approved: true` is caller attestation, not a separate enforced human approval inbox.
Do not describe the existing desktop as an autonomous release controller.
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
