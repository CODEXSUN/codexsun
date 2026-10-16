# Site Studio plan

Status: architecture and local storage initialization. Date: 16-10-2026.

## Product and ownership

Build Site Studio entirely under `apps/sites` to manage client portfolio websites.
Use Platform identity and runtime integration through public contracts.
Start with code-owned templates and CMS-owned sections, pages, blogs, media, navigation, and SEO.
Add visual composition after publishing and deployment work. Full commerce and unrestricted plugins are outside the first release.

Platform owns login, tenant routing, entitlements, permission infrastructure, queues, secrets, and audit infrastructure.
Sites owns client relationships, websites, editorial content, publishing, deployment records, and health results.
Use the shared layout and UI components. Studio uses Platform login and authenticated tenant context.

## Mandatory code location boundary

All Site Studio implementation and tests belong under `apps/sites`.
Platform identity integration does not make Studio a Platform-owned feature.

| Location                     | Responsibility                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/sites/api/src/modules` | Studio permissions, authorization decisions, client/site records, content, migrations, seeds, publishing, deployment workers, monitoring, and backend tests |
| `apps/sites/web/src/modules` | Studio screens, routes within the Studio surface, forms, validation, hooks, services, navigation definitions, and frontend tests                            |
| `apps/sites/clients`         | Client templates, compiled site sources, content delivery runtimes, SQLite/D1 adapters, and runtime tests                                                   |
| `apps/sites`                 | Studio documentation and app-owned build/deployment configuration                                                                                           |

Consume identity, authenticated transport, database context, queue registration, secret storage, and audit infrastructure through public contracts.
Sites declares and enforces its business permissions using the supplied authorization capability.
Sites owns queue handlers and audit event definitions. Shared infrastructure only executes or records them.
Do not put Studio CRUD, schemas, business routes, content logic, editors, deployment logic, or monitoring rules inside `apps/platform`.
Do not import private Platform files from Sites. Inject public host capabilities at the application boundary.

Existing Platform files contain app registration, session/context adapters, migration/seed invocation, and screen mounting.
These are host composition references, not the location for Studio implementation.
This plan and initialization require no changes under `apps/platform`.
Future Studio features must export their public entry points from Sites and keep internal page selection within Sites.
If existing host interfaces cannot support a feature, document the missing generic contract before proposing a separate host change.

Verification must inspect both Sites and its host references for misplaced business behavior.
Passing a filename or module-boundary check alone does not establish this boundary.

An agency tenant can manage multiple clients in its isolated MariaDB database.
A client record is not automatically a Platform tenant. Separate tenants retain separate databases.
Enforce client and site membership within each tenant. Never select tenant databases from browser parameters.
Use Core contact and company public lookup contracts instead of copying their private records.

## Current implementation

The API already has overview and site registry modules with migration, seeds, and lifecycle routes.
The Web workspace exports Sites-owned overview and site management components for host composition.
The clients workspace builds CODEXSUN, LogicX, and TechMedia separately, with default ports 7130, 7131, and 7132.
The existing README describes an older foundation and understates this implementation.
Seeded status and page counts do not prove a deployed site is live.

Before production authoring, close these observed gaps:

- Site registration checks app activation, but its context supplies no per-action authorization callback.
- The client CMS helper reads a localStorage bearer token. Replace this before connecting editorial tools.
- Default portfolio seeds need an explicit sample/bootstrap policy before customer onboarding.

## Data model and module boundaries

| Leaf owner        | Main fields and relationships                                                             |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Client            | Name, contact/company references, status, site ownership                                  |
| Site              | Existing UUID, name, slug, domain, port, theme, description, status, new client reference |
| Page              | Site, path, title, typed sections, SEO, draft revision                                    |
| Blog post         | Site, slug, title, summary, body, author, media, publication date                         |
| Media             | Site, object reference, type, size, checksum, alt text                                    |
| Navigation        | Site, ordered labels, URLs, page references                                               |
| Publication       | Site, immutable snapshot, revision, checksum, schema version                              |
| Deployment target | Site, runtime, environment, origin, verified domain, port, encrypted credential reference |
| Deployment        | Target, artifact hash, publication, queue job, state, previous release                    |
| Health check      | Target, timestamp, HTTP result, latency, release, error                                   |

These are planned owners, not a generic entity registry.
Each implemented leaf owns its migration, repository, service, routes, types, seed, and matching frontend roles.
Add workers, events, and sync roles only when executable behavior exists.
Extend the existing site registry instead of adding a competing site table.
Use integer database IDs and unique eight-character lowercase hexadecimal public UUIDs.
Keep tenant business records in the tenant database without redundant tenant columns.

## Storage and hosting

MariaDB is authoritative for client data, drafts, publications, configuration, and operation history.
Object storage holds media and immutable build artifacts. MariaDB stores references and checksums.
Client hosts never receive MariaDB access or Studio session credentials.

| Mode        | Client deployment                            | Content update                                   |
| ----------- | -------------------------------------------- | ------------------------------------------------ |
| Hardcoded   | Compiled HTML, CSS, JavaScript, assets       | Rebuild and deploy                               |
| Static CMS  | Generated HTML and assets from a publication | Publish, rebuild, deploy                         |
| Dynamic CMS | Compiled frontend and a content runtime      | Sync published content without rebuilding layout |

Plain HTML hosts cannot execute SQLite queries or background sync. Export generated HTML or public JSON for those hosts.
Current Vite clients render in the browser. A Vite build alone is not a prerendered HTML publishing pipeline.
Add route prerendering, metadata, sitemap, and canonical URLs before claiming static SEO export.

Use one persistent SQLite database per site on ordinary Node servers.
Store that database outside build directories in production.
Use site-specific D1 and Worker static assets on Cloudflare.
D1 uses SQLite SQL semantics. It does not require a writable SQLite file inside the deployed Worker.
Shared servers route verified hostnames to sites. Ports identify listeners, not Cloudflare tenant boundaries.

## Content publication and delivery

The first dynamic resource is the blog post. Keep blog and page endpoints separate and fixed.
Proposed client routes are `/content/v1/blog-posts` and `/content/v1/blog-posts/:slug`.
The runtime resolves its configured site. Browsers cannot choose a tenant or another site.
Return published fields only, with bounded pagination, revision, ETag, and explicit cache policy.
Exclude drafts, internal IDs, editorial notes, credentials, and private client details.

Publish an immutable snapshot containing schema version, site UUID, revision, checksum, and approved content.
Use revocable site-scoped server credentials for delivery. Keep credentials out of browser bundles and logs.
Validate snapshot identity, schema, and integrity before applying it transactionally.
Make retries idempotent and reject stale revisions and wrong-site snapshots.
Use full replacement or deletion markers so withdrawn posts disappear after successful sync.
Keep the last valid snapshot during Studio outages and show sync delay in Studio.
Withdrawal completes after delivery and cache expiry. Failed withdrawal must raise an operational error.
Preview requires short-lived authorization and must never enter public caches.

## Build, deploy, and monitor

1. Check app activation, membership, action permissions, content validation, and target ownership.
2. Create an immutable approved publication.
3. Queue a build through Platform Queue Manager with tenant context, correlation ID, and retry policy.
4. Build an approved template in an isolated environment.
5. Store the artifact, checksum, manifest, route list, and publication reference.
6. Deploy to staging and verify routes, published content, and health.
7. Promote after explicit publishing approval and record the active release.
8. Retain the previous artifact for rollback.

Start with downloadable artifacts, then Cloudflare Workers, then managed Node and shared static hosts.
Do not accept arbitrary shell commands or executable client uploads.
Encrypt deployment credentials and mask queue payloads and results.
Verify domain ownership before binding a domain.
Monitor approved targets only. Block private-network probes, unsafe redirects, and arbitrary editor-supplied URLs.
Show draft revision, publication, deployed build, content sync revision, and health as separate states.
Site suspension blocks new publishing and sync. It does not prove an existing remote site is disabled.
Remote disable requires an executable target job and successful verification.

## Security and lifecycle gates

Use Plan Access first, then live activation and backend action checks.
Permissions follow `scope.module.resource.action`, such as `sites.publication.release.publish`.
Audit edits, lifecycle actions, publication, rollback, credential rotation, and target changes.
Sanitize rich text and links. Validate media types and size.
Protect active targets, retained releases, and linked content from unsafe deletion.
UI controls mirror backend authorization. Prompts and tenant settings cannot grant capabilities.

## Phases and acceptance

| Phase | Deliverable                                                          | Acceptance                                                                       |
| ----- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 0     | Plan and local SQLite identity store                                 | Identity survives reopen and rejects wrong-site reuse                            |
| 1     | Clients, site ownership/settings, permissions, audit, seed policy    | MariaDB persistence, forbidden-action, two-tenant and two-client isolation tests |
| 2     | Blog/page drafts, typed template sections, media, revisions, preview | Draft isolation, validation, sanitization, and preview authorization             |
| 3     | Snapshots, queued sync, SQLite/D1 adapters, public blog API          | Retry, stale revision, wrong-site, deletion, outage, and cache tests             |
| 4     | Static export, Worker staging, target secrets, promotion, rollback   | A real staged site serves its approved release and rolls back                    |
| 5     | Scheduled health, sync controls, logs, remote disable, alerts        | Jobs execute and failures show accurate state without exposing secrets           |
| 6     | Section editor, navigation, themes, responsive preview               | Export matches preview and permits only approved components                      |

The first vertical slice is one authorized client, one site, one blog draft, one publication, and one deployed content reader.
Complete that baseline before a drag-and-drop builder.

## Initialization and compatibility

Phase 0 adds a runnable local SQLite identity store under `clients/runtime/content`.
It contains no content sync, blog tables, D1 adapter, publishing worker, visual builder, or deployment service.
It creates no MariaDB migration and changes no tenant records.
Future site ownership changes require registered migrations that explicitly upgrade existing tables.
`CREATE TABLE IF NOT EXISTS` cannot add those fields to existing sites.

Run these commands from the repository root:

```sh
node apps/sites/clients/runtime/content/init.mjs c0de0001 dist/sites-data/codexsun/content.sqlite
node --test apps/sites/clients/runtime/content/content-store.test.mjs
```

This creates local development storage only. Use a persistent path outside build output in production.
The Node adapter does not run inside Workers. Phase 3 implements a separate D1 adapter.

## Cloudflare references

- [D1 overview](https://developers.cloudflare.com/d1/)
- [D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)
- [Worker static assets](https://developers.cloudflare.com/workers/static-assets/)
