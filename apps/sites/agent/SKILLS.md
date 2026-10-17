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

## Deployment preparation

Export published projections only. Preserve drafts and private Core data inside Studio.
Resolve the opaque deployment identity from authenticated tenant and site context. Never accept that identity from browser input.
Bind each SQLite file to its site UUID and opaque tenant/site key. Enforce sequence and checksum checks on every import.
Keep the database outside release/public folders and preserve enquiries during content replacement.
Do not describe checksum integrity as signature authentication. Imported artifacts require a trusted operator channel.
Force production build mode independently of the root development environment.
Verify rendered HTML without JavaScript, hydration, canonical URLs, sitemap routes, assets, enquiry persistence, and restart recovery.
Keep contact records out of public responses, artifact folders, logs, and screenshots.
Distinguish a stored enquiry from an email notification. Never invent a client phone number or physical address.
Node runtime verification does not prove Docker, systemd, TLS, DNS, Cloudflare, or external deployment.

## Enquiry inbox and software catalogues

Keep enquiry persistence in the API Enquiry leaf. Client servers use the public enquiry runtime export.
Resolve the SQLite namespace from authenticated tenant and saved site identity. Never accept a browser path or database name.
Check view, update, and delete permissions on every protected request. Keep public submission separate from administration.
Preserve existing submissions during transactional SQLite upgrades. Test status, stale revisions, trash, restore, and audit persistence.
Keep visitor messages immutable and expire their activity with the retained enquiry.
Describe attached storage and remote transport separately. Do not claim remote SQLite or D1 connectivity from a local test.
Keep application catalogue text in the published page draft. Do not import private implementations from listed apps.
Represent foundation modules honestly. Catalogue links do not grant entitlements or bypass Platform sign-in.
Check all generated service and application routes, canonical metadata, mobile widths, and prefilled enquiry links.


## LogicX marketing redesign

Keep new marketing contracts and defaults inside the Page API leaf, and their editors inside the matching Page Web leaf.
Keep the marketing field optional so older publications remain compatible.
Use the existing draft revision, publication, permissions, and client delivery paths.
Allow only deployed local marketing image paths. Do not accept arbitrary HTML, scripts, or external image URLs.
Preserve checksum inputs for older snapshots. Do not inject new defaults into an immutable delivery snapshot.
Treat dashboard numbers as labeled demonstration content. Do not turn them into company statistics.
When replacing a design, remove unused template components and selectors after the replacement passes review.

## Cloudflare delivery

Keep Worker deployment code under `clients/cloudflare`. Keep D1 enquiry persistence inside the Enquiry API leaf.
Clients must use the public `@codexsun/sites-api/enquiry-d1` export.
Prepare artifacts from a verified authenticated publication export. Deploy only its published projection and approved public assets.
Use a dedicated database per deployed client. Verify both the site UUID and opaque site key before database operations.
Keep management credentials in Wrangler OAuth or ignored environment storage, never the Worker bundle.
Preserve atomic rate enforcement, duplicate-request conflict checks, consent, exact-origin validation, bounded bodies, and retention.
Use root dist for build output and absolute paths for Wrangler output flags.
Remote D1 inbox integration remains unimplemented. Never bypass Studio permissions with a public management route.
Manual operator promotion is supported. Future automated delivery requires queued, auditable deployment jobs.
