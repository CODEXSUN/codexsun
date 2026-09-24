# Workspace 1.0.37 change log

Date: 2026-09-24. Environment: Windows PowerShell, repository root `E:\codexsun\codexsun`.

This record covers the pending tracked and untracked changes inspected for version 1.0.37.
It records source changes, not a claim that every feature passed tests or reached production.
The user requested coverage of all pending work after the initial Zetro2-only release preparation.

## Version and publication

- Root and npm workspace manifests, plus the root lockfile, use version 1.0.37.
- The release tag name is `v-1.0.37`. This review did not create or push that tag.
- The imported ZVcode manifest retains upstream version 1.110.0. It is not a root npm workspace.
- The user approved keeping `CODEXSUN/codexsun` public. Repository visibility was not changed.
- Public source does not grant public access to workspaces, credentials, or running services.
- Imported editor source retains its upstream licenses and notices.

## Pending change inventory

| Area                  | Files or directory                                                          | Observed changes                                                                                                             |
| --------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| CRM API               | `apps/crm/api/src/modules/foundation/`                                      | Separate SQLite column additions; customer/contact, qualification, conversion, enquiry activity, and communication routes.   |
| CRM web               | `apps/crm/web/src/app.tsx`                                                  | Lead selection, qualification, and conversion controls with query refresh.                                                   |
| HIMSX                 | `apps/himsx/.container/`, API config, README                                | Repository storage bind mount, launch-directory-aware SQLite path, and explicit drop storage cleanup.                        |
| Shared identity       | `packages/platform-core/src/identity-configuration.ts`, `local-identity.ts` | Optional application role permissions extend development admin and user seeds.                                               |
| Orship deployment API | `devkits/orship/api/src/modules/deployments/`                               | New provider contract, Dokploy adapter, persistence, module provider, routes, and adapter tests.                             |
| Orship integration    | API config/server/tests, Compose, environment example                       | Provider and secret-reference configuration, deployment registration, permissions, and ESM import corrections.               |
| Orship web            | `devkits/orship/web/src/modules/deployments/`, `app.tsx`                    | Deployment workspace, API client, navigation, and URL-backed page selection.                                                 |
| Deployment guidance   | Orship READMEs and `assist/operations/deployment-profiles.md`               | Orship ownership, optional Dokploy adapter, secret handling, and provider boundaries.                                        |
| ZCode runtime         | `devkits/zcode/.container/` and README                                      | Named Compose profiles, validated profile ports, configurable public preview ports, and lifecycle script selection.          |
| ZCode planning        | `devkits/zcode/agent/`                                                      | Agent design brief, phased plan, task checklists, automation, and Memory Bank documents.                                     |
| Zetro2 planning       | `devkits/zetro2/agent/` and README                                          | App ownership, task/run separation, provider/tool adapters, context, verification, Memory Bank, and remote-device approvals. |
| ZVcode import         | `devkits/zetro2/zvcode/`, `editor/`                                         | Copied editor source, product/package branding, upstream provenance, preserved notices, and source verifier.                 |
| Dokploy evaluation    | `apps/temp/dokploy/.container/`                                             | Local Dockerfile, Compose, setup/update scripts, environment example, and operating notes.                                   |
| Gitpod evaluation     | `apps/temp/gitpod/local-preview/`                                           | Local preview Compose, setup/verify/drop scripts, and isolation warnings.                                                    |
| Repository controls   | `.gitignore`, root scripts                                                  | Ignore temporary source and secret files; expand Orship validation commands.                                                 |
| Lockstep version      | Root/workspace `package.json` files and `package-lock.json`                 | Version 1.0.36 to 1.0.37. Other application manifests have version-only changes.                                             |

## Database and operational impact

Database impact is **Yes** for this combined inventory.
The earlier Zetro2-only classification of no database changes does not describe the expanded scope.

- CRM changes an existing migration implementation. Reapplying an already recorded migration was not tested.
- Orship adds migration definitions for deployment state and audit records. MariaDB upgrade and rollback were not tested.
- HIMSX changes storage location semantics. Existing named-volume data needs a verified backup and migration before switching a live instance.
- The HIMSX drop script now removes app storage. No drop, purge, or destructive lifecycle command was executed.
- Identity permission seed changes need existing-user and fresh-database verification.
- The Dokploy wrapper mounts the Docker socket. The Gitpod preview uses privileged access and is for disposable local testing.
- ZCode remains a localhost-only demo without authentication. Named profiles do not provide user authorization.

## Verification performed

Commands ran from the verified repository root on 2026-09-24.

| Command                                                          | Result                                                          | Boundary                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `node tools/check-versions.mjs`                                  | Passed: `v-1.0.37` alignment                                    | Root/workspace versions, lockfile, and changelog state.                      |
| `node devkits/zetro2/editor/verify-zvcode.mjs`                   | Passed                                                          | Product/package identity, packaging hooks, and unchanged license notices.    |
| `node --test devkits/zcode/.container/zbrowser/catalog.test.mjs` | Passed: 3 tests                                                 | Catalog grouping, profile port mapping, invalid targets and duplicate ports. |
| `git diff --check`                                               | Passed with a CRLF conversion warning for the ZCode agent brief | Tracked working-tree whitespace only; not a full source or secret audit.     |

The ZVcode directory contains 9,286 files totaling 149,099,828 bytes at inspection time.
That count confirms local source presence, not compilation or complete Git staging.

## Not verified in this review

- CRM, HIMSX, Orship, and shared identity full test suites and browser workflows.
- Live Dokploy integration, provider credentials, deployment actions, or production approval enforcement.
- Database migration, backup/restore, container lifecycle, and restart persistence checks.
- ZVcode compilation, authenticated editor access, agent backend wiring, and live coding task completion.
- Mobile notification delivery, authorized-device controls, and unattended task execution.
- Full repository build, lint, typecheck, source secret audit, and release artifacts.

## Handoff

This documentation update does not modify the application changes listed above.
It does not stage files, create a commit, push source, or deploy a server.
Review the final commit scope and run the relevant application checks before release publication.
Do not treat a public source push as evidence that the private coding environment is live.
