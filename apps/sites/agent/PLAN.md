# Site Studio work plan

## Current scope

Establish the app-owned agent guidance and clean implementation sequence first.
Keep the architecture and acceptance matrix in [STUDIO-PLAN.md](../STUDIO-PLAN.md).
Do not treat this plan as evidence that planned features already work.

## Verified baseline

- Sites has API and Web workspaces, site registry code, and three client website builds.
- The local SQLite identity store initializes a database and rejects another site's UUID.
- Earlier initialization checks passed for storage tests, Sites types/builds, boundaries, and dependency layout.
- Those earlier checks are historical results. Rerun affected checks after implementation changes.
- No Studio feature code was added to Platform during initialization.

## Implementation sequence

1. Inventory site routes, schemas, persistence, frontend behavior, seeds, and existing host contracts.
2. Define client ownership, membership rules, required fields, and explicit upgrades for existing site records.
3. Implement backend action permissions, audit events, seed policy, and safe identity transport using public capabilities.
4. Implement Clients and site settings in their owning API and Web leaf modules.
5. Verify persistence, denied actions, two-tenant isolation, and two-client isolation.
6. Add one blog draft workflow, revision storage, and authorized preview.
7. Add immutable publication and queued delivery to a local SQLite reader.
8. Add D1 delivery, static export, and staged Worker deployment.
9. Add rollback, health jobs, remote controls, and operational visibility.
10. Add the visual section editor after the publishing baseline passes.

Each step must deliver working behavior and the relevant acceptance checks before its status changes to complete.
Steps 2 through 10 remain planned. Step 1 needs a focused implementation audit before business-code changes.

## First implementation gate

Inspect the current site context's missing per-action authorization capability.
Identify the public host contract for authorization and audit recording.
Inspect the browser-token CMS helper before connecting any editorial UI.
Resolve existing portfolio seeds without automatically creating sample client sites for every customer.
Keep missing infrastructure dependencies explicit. Do not bypass checks or place business logic in Platform.

## Completion evidence

For code changes, run formatting, focused lint, affected type checks, module boundaries, builds, and dependency checks.
Run meaningful persistence, authorization, and isolation tests when those behaviors change.
Report live database and staged deployment checks separately from unit tests.
Record migration requirements for existing databases. Never claim an unexecuted check passed.
