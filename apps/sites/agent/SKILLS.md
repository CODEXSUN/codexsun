# Site Studio skills

Use this file for Site Studio planning, implementation, refactoring, and review.
Read the [task and working rules](TASK.md) for scope and ownership, and the [plan](PLAN.md) for architecture and delivery order.
This is repository guidance, not a globally installed skill or runtime permission source.

## Implementation workflow

1. Inspect the affected routes, storage, UI, seeds, tests, and public host contracts.
2. Select the next working slice from the plan and state its acceptance criteria.
3. Keep entity behavior in its owning API and Web leaf modules under `apps/sites`.
4. Inject public identity and infrastructure capabilities instead of importing private Platform code.
5. Keep client templates and content delivery adapters under `apps/sites/clients`.
6. Update the existing plan when implementation and verification support a status change.

## Content and delivery checks

Check tenant activation, action permissions, and client/site membership before protected operations.
Keep drafts and operational records in tenant MariaDB. Deliver published projections only.
Use SQLite for ordinary client servers and a separate D1 adapter for Workers.
Keep drafts, credentials, and internal records out of public content.

Use queued, auditable jobs for content delivery and deployment.
Verify target identity, reject stale revisions, make retries safe, and preserve rollback artifacts.
An SPA build does not prove prerendered HTML support. A registry status does not prove remote deployment.
Complete the publishing baseline before adding a visual builder.

## Verification

Apply repository checks for the affected code and the plan's current phase acceptance gates.
Test wrong-site access, denied actions, stale revisions, retries, and deletion when those behaviors change.
Report unit tests, live persistence checks, and deployment verification separately.
Report migration prerequisites and skipped checks. Do not claim planned features already work.

## Supporting skills

Resolve these skills from the session catalog and read them when applicable.
Keep their instructions in their original sources.

| Skill                    | Use                                                                |
| ------------------------ | ------------------------------------------------------------------ |
| `code-style`             | Write or edit code                                                 |
| `technical-writing`      | Write documentation and plans                                      |
| `ui-design`              | Design Studio screens where no more specific design system applies |
| `cloudflare`             | Implement Worker, D1, domain, or Cloudflare deployment behavior    |
| `workers-best-practices` | Write or review Worker code                                        |
| `wrangler`               | Before running Wrangler commands                                   |

Read the repository design-system helper before UI changes.
Read API, tenancy, migration, or deployment guidance when changing those areas.
Do not use the Sites website-builder connector for this repository app unless the user requests that service.

Keep this guidance in one file. Do not recreate a nested skills folder or duplicate the agent guide and plan.

## Standard client workspaces

Use the saved site ID for every page and blog operation. Never infer ownership from a browser-supplied database or tenant value.
Keep standard client defaults neutral. Leave unknown services, contact details, and blogs empty.
Create a new site and its initial website draft in one transaction.
Public route projections share one saved website publication. Do not describe them as independent page CRUD.
Each local client must proxy its own slug and validate the returned publication identity.
Find the checkout from verified ancestor directories. Do not assume one source or build folder depth.
Verify source and compiled-location lookup, real startup, per-client publication isolation, and the five standard public routes.
