# Site Studio plan

## Tenkasi Sports public client and Cloudflare delivery — October 19, 2026

- **Ownership Boundaries**:
  - AGR-4 owns `apps/sites/clients/**` (Tenkasi Sports public frontend and Cloudflare Worker) and minimal Sites CMS publication registration.
  - AGR-1 owns `apps/sportsclub` (member API, business models, private administration).
  - AGR-3 owns `apps/platform` (identity provisioning, tenant routing, host proxy, auth desks).
  - Cross-component coordination is conducted strictly via typed public schemas and HTTP API contracts.
- **Delivery & Architecture**:
  - Cloudflare Worker (`apps/sites/clients/cloudflare/tenkasisports.mjs`) handles apex/www routing, public asset delivery, and proxying.
  - Fail-closed tenant context validation against Platform `GET /api/platform/public/portals/tenkasisports/health`. Returns 503 `TENANT_SETUP_PENDING` if backend is unreachable or corporate ID is not `TENKASISPORTS`.
  - Same-origin POST enforcement with caller cookie stripping. Outbound requests sign HMAC headers (`x-codexsun-public-client`, `x-codexsun-client-time`, `x-codexsun-client-signature`) verified by Platform `verifiedSportsclubPortalClient`.
  - Canonical forwarding directly to `/public/sportsclub/registration` and `/public/sportsclub/enquiry`. No fallback to legacy `/student/register` (strictly returns 404 on missing routes).
- **Execution Gates**:
  1. Unit and worker proxy tests: `tenkasisports.worker.test.ts` (signed delivery, idempotent updates, fail-closed guards, same-origin, HMAC client headers).
  2. Platform integration tests: `sportsclub-platform.test.ts` (tenant isolation, role checks, schema validation).
  3. Static typing and linting: `@codexsun/sites-clients`, `@codexsun/sites-api`, `@codexsun/sites-web`.
  4. Module boundaries check: `node tools/check-module-boundaries.mjs sites`.
  5. Static build: `npm run build:tenkasisports -w @codexsun/sites-clients`.
  6. Coordinator gate: Await backend deployment on `codexsun.com` before Cloudflare Worker production deployment.

## Tirupur Connect content management — October 17, 2026

Open Sites → Tirupur Connect → Manage. Client details edits branding and public contacts. Pages → Textile edits hero imagery, category copy and images, directory and community headings, the sourcing guide, the closing banner, pending-state copy and public page introductions. Hero, Page & SEO, and Footer have their own sections. Individual category images use full crops. Image sheets use a 3 by 2 crop. Use deployed local image paths or public HTTPS JPG, PNG or WebP URLs. File upload is not included.

Save draft keeps edits private. Publish page creates the public version using existing permissions and revision checks. Start connects the local preview to this client's publication. Business records, credentials, account access, enquiries and conversations remain TConnect-owned and require TIRUPURCONNECT. CMS content never changes that tenant selection.

Live delivery uses an authenticated publication export, not a development API or public management endpoint. Export through the existing client publication control. Set `CODEXSUN_SITES_TIRUPURCONNECT_SNAPSHOT` to the absolute exported JSON filename. Run `npm run build:tirupurconnect -w @codexsun/sites-clients`, then `wrangler deploy --config apps/sites/clients/cloudflare/wrangler.tirupurconnect.jsonc --keep-vars`. The builder verifies checksum, slug, domain and pinned site UUID `e303865e`. It embeds only the published content and blogs, without delivery keys or private drafts. The deployed site reads that version through a read-only same-origin endpoint. Subsequent Studio publication needs another export/build/deploy; automatic remote delivery is not implemented.

No SQL column migration is required for the optional textile content field. Existing publications remain valid. Existing Tirupur Connect generic drafts need approved content initialized before export. The local CMS integration check verifies draft isolation, publish, stale saves, unsafe-image rejection and export. Unit checks cover deployment identity and safe embedding. VPS configuration and a remote Studio registry remain separate.

## Tirupur Connect public client — October 17, 2026

Sites owns the public textile-network layout, assets, metadata, local startup, and Cloudflare delivery.
TConnect owns public business contracts, form validation, and authenticated business workspaces.
Keep cross-app imports on `@codexsun/tconnect-web/public`. Do not import private TConnect workspace implementations.
Register the named client locally and preserve the existing Cloudflare Worker and zone routes during the move.
Never use CODEXSUN records as a fallback for TIRUPURCONNECT. Keep the pending-state sourcing guide useful and truthful.
Keep the current scope frontend-only. The user manages VPS tenant setup separately.
The custom layout remains code-owned. Public copy, images, banners and contacts are editable in its Sites Page publication.

Status: LogicX is deployed to its Cloudflare custom domain. The redesign also retains its local runtime. Updated: 2026-10-17.

The LogicX redesign masterplan below supersedes earlier visual directions for LogicX.
Existing ownership, tenant isolation, publication, and enquiry requirements remain in effect.
Implementation authorized by the user. Use the corrected reference supplied on 2026-10-17.

## LogicX complete redesign masterplan — 2026-10-17

Status: implemented against the corrected abstract green reference. Local publication, Studio editing, and enquiry delivery verified.

Visual source: [user-supplied complete design](logicx-design-reference.png).
The corrected image defines the visual direction. Text, numbers, and interface data inside it are illustrative.
It replaces the earlier desktop-monitor photograph and six-cell service grid.
Earlier Be IT Service and Avada references remain historical context, not competing visual systems.

### 1. Outcome and scope

Create one consistent LogicX software development and application sales website.
Help visitors understand the services, explore applications, and submit a relevant project enquiry.
Match the corrected reference: organic diagonal shapes, a tilted software panel, a four-card service carousel, and a flowing dark approach section.
Extend that system through every existing LogicX route and interaction.
Keep all implementation, assets, contracts, editors, tests, and documentation inside `apps/sites`.
Keep Ramu Tex and other client templates visually unchanged.

This scope is an enquiry-led sales site. Checkout, subscriptions, payment processing, and automatic app provisioning are separate work.
Application links do not establish production readiness or grant access to a listed business app.

### 2. Visual system

| Element | Planned treatment |
| --- | --- |
| Palette | White and warm neutral surfaces, near-black text, deep forest green, restrained mint accents |
| Starting colors | Ink `#101713`, forest `#003e2f`, accent `#087347`, mint `#60dfa0`, muted `#626b68` |
| Typography | Keep self-hosted Geist initially. Match the reference with large, tightly spaced headings and clear body text |
| Desktop sizing | Hero heading about 64–84 px, section headings 42–56 px, body 16–18 px |
| Mobile sizing | Hero heading 38–48 px, section headings 30–36 px, body at least 16 px |
| Layout | Centered 1280–1360 px content width, fluid side padding, deliberate vertical rhythm |
| Buttons | Rounded pills, deep green primary action, outlined secondary action, small directional arrows |
| Dividers | Fine neutral lines and open layouts. Avoid repeated heavy boxes and shadows |
| Icons | One consistent line-icon family. Use official technology marks where permitted |
| Photography | Architectural crops and foliage inside curved diagonal shapes, with white space and deep green ribbon forms |
| Motion | Short eased fades and small translations. Preserve content when animation is unavailable |

Treat these values as implementation starting points. Compare rendered screenshots with the reference before finalizing them.
Use separate desktop and mobile image crops. Do not embed headings or buttons into a background image.
Preserve readable text over photography with a controlled white or dark overlay.

### 3. Homepage composition

| Order | Section | Design and behavior |
| --- | --- | --- |
| 1 | Header | LX mark and LogicX wordmark, Services, Applications, About, Insights, Support, and project CTA |
| 2 | Photographic hero | Large left-aligned headline, short introduction, two actions, and an oversized tilted software panel inside curved diagonal layers |
| 3 | Trust context | Keep the corrected composition free of business statistics. Use capability labels on service detail pages |
| 4 | Technology strip | Frappe, ERPNext, React, Tailwind CSS, Python, and Node.js in a restrained monochrome treatment |
| 5 | Services overview | Full-width heading and introduction, carousel controls, and four curved cards visible on desktop |
| 6 | Approach banner | Deep green flowing surfaces, foliage and concrete crops, curved upper edge, introduction, CTA, and three numbered steps |
| 7 | Application collection | Curated app previews with concise outcomes and links to the full catalogue |
| 8 | Software in practice | Clearly labeled example workflows or verified project stories. Do not imply fictional customer work |
| 9 | Industries | Manufacturing and textiles, retail and ecommerce, professional services, and growing businesses |
| 10 | Engagement options | Custom build, ERP and automation, and ongoing support with enquiry actions |
| 11 | FAQ | Accessible expandable answers about scope, integration, cost planning, delivery, and maintenance |
| 12 | Closing CTA | One strong invitation to discuss a project, with phone and WhatsApp alternatives |
| 13 | Footer | Brand, services, applications, company links, saved contact details, privacy, and copyright |

The reference shows the top of the homepage. Lower sections must continue its restrained visual language.
Remove duplicate introductory blocks, repeated process sections, and competing banners from the current homepage.
Retain useful current sales copy, but rewrite it into this order rather than appending more sections.

#### Hero details

- Keep the headline as selectable HTML: "Your business. Connected by better software."
- Use an original or licensed workspace photograph with a suitable clear area for the heading.
- Build a code-owned tilted software demonstration panel. Do not use the previous desktop-monitor photograph.
- Show demonstration interface data only. Do not present dashboard figures as real LogicX business results.
- Set the primary CTA to the existing contact form with the project topic prefilled.
- Set "See how it works" to the approach section with a descriptive arrow icon initially.
- Use a play icon and video dialog only after a real accessible demo video exists.
- Do not publish the reference's `100+`, `50+`, or `4.9/5` figures without confirmed evidence.
- Omit the metrics strip in this corrected composition. Keep editable capability labels available where useful on inner pages.

#### Services and approach

Show four cards per desktop carousel view. Include all eight services with previous/next controls and keyboard/touch navigation.
Keep Websites/Ecommerce and Hosting/Maintenance/Support available through the complete Services page.
Use CMS service names and descriptions. Select featured services by stable identity instead of array position.
Keep three approach stages: understand the work, deliver useful software, and support what grows next.
On small screens, replace the broad curve with a shallow curve that does not clip content.

### 4. Whole-site page system

| Page | Required content and design |
| --- | --- |
| Home `/` | Complete sequence above with the photographic hero and clear enquiry journey |
| Services `/services` | Minimal open rows with a distinct image for each service, smooth hover previews, and visible mobile previews |
| Service details | Service-specific hero, problems addressed, deliverables, integrations, process, related apps, FAQ, and prefilled enquiry |
| Applications `/apps` | Current catalogue, search, category filters, truthful capability descriptions, and clear enquiry links |
| Application details | Purpose, intended users, capabilities, setup and integration considerations, support scope, and enquiry CTA |
| About `/about` | Company introduction, working principles, delivery approach, technology expertise, and contact invitation |
| Insights `/blogs` | Published posts with useful empty, loading, and error states |
| Article details | Readable article width, heading structure, metadata, image alt text, and related enquiry link |
| Support `/support` | Support scope, request preparation, maintenance options, contact channels, and support enquiry CTA |
| Contact `/contact` | Existing functional form, saved phone/email, map only where meaningful, WhatsApp, success receipt, and errors |
| Privacy `/privacy` | Accurate explanation of collected enquiry data, purpose, retention, and contact channel |
| Unknown paths | Useful 404 with Services, Applications, and Contact links |

Preserve the current public URLs and all generated service and application routes.
Recalculate the route inventory from the publication during verification rather than hard-coding the previous count of 39.
Keep "Applications" visible in navigation because the catalogue is a core sales destination.
The reference's "Work" label becomes a homepage anchor to software examples for this release.
Add it to navigation only when that section contains useful approved material.
A separate case-study route and editor require their own content contract and scope review.

### 5. Image and brand asset plan

| Asset | Requirement |
| --- | --- |
| Hero workspace | Original or licensed high-resolution photograph, desktop and mobile crops, optimized AVIF/WebP with fallback |
| Monitor display | Clean product demonstration visual with readable composition and fictional, labeled data |
| Approach photograph | Dark architectural scene that supports white copy and the curved boundary |
| Service visuals | Eight distinct subjects: code, ERP modules, React, mobile, automation, integrations, ecommerce, and support |
| Brand assets | Matching `logo.svg`, `logo-dark.svg`, favicon, touch icon, and social sharing image |
| Technology marks | Approved official assets or text wordmarks. Do not imply vendor partnership or certification |

Use the current distinct service illustrations as a fallback until the final artwork is ready.
Do not reuse one dashboard with different colors for all services.
Store implementation assets under the LogicX client-owned source or public asset directories.
Record external asset attribution and license requirements in the existing agent documentation.
Do not hotlink vendor theme assets or depend on temporary clipboard files in production.
The saved reference image is a planning artifact, not a production hero asset.

### 6. Interaction and responsive behavior

- Keep one primary project CTA per section and use consistent enquiry wording.
- Use URL query topics for service, application, consultation, and support enquiries.
- Preserve the floating WhatsApp action without covering text, forms, or mobile navigation.
- Make the phone action use the client's saved number. Do not duplicate a hard-coded contact number.
- Make service previews fade and translate gently over about 350–550 ms without moving surrounding rows.
- Keep service images inside a reserved lane. Avoid overlap with titles and descriptions at tablet widths.
- Show the same preview on keyboard focus. Keep previews visible on touch layouts.
- Use native FAQ disclosure controls or an equivalent accessible implementation.
- Give navigation open/close controls correct labels, focus behavior, and Escape support.
- Avoid decorative parallax, continuous animation, and automatic carousels.
- Respect reduced motion. Never hide essential content behind an entrance animation.

Desktop uses the layered hero composition, four-card service carousel, and three-column approach.
Tablet uses a narrower hero composition, two visible carousel cards, and a wrapped approach.
Mobile stacks headline, actions, visual, technology marks, services, and approach in reading order.
Do not force the desktop photograph into a mobile crop that hides the product or obscures copy.
Verify at 360, 390, 768, 1024, and 1440 px widths, including zoom and long content.

### 7. Studio content and persistence plan

Existing service text, profile, applications, blogs, and contact details already use the site publication.
Current engagement, industry, and FAQ copy includes code-owned template content.
The redesign must clearly separate fixed layout from editable client content.

Extend the Sites Page leaf with optional, typed LogicX marketing fields for:

- Hero media, headline, introduction, and primary/secondary action labels. Layout and crop rules remain code-owned.
- Technology labels and approved mark references.
- Featured service identities and section introduction.
- Approach introduction, image, and three ordered steps.
- Example workflows with an explicit demonstration label.
- Industry text, engagement options, FAQs, and final CTA copy.
- Capability labels for service detail pages. Business statistics are excluded from the corrected layout.

Keep layout markup, approved icon choices, and responsive rules code-owned.
Use structured fields instead of arbitrary HTML, script injection, or an unrestricted page builder.
Validate URLs, media references, lengths, and allowed action types on the server.
Private source notes must not enter the public publication projection.
Use the Page leaf's existing permission, revision, draft, and publication mechanisms.
Add matching Studio editors inside the Page frontend leaf. Do not put marketing forms in Platform.

Inspect the actual storage schema before implementation.
If content remains in the existing JSON aggregate, version the schema and normalize missing optional fields without resetting drafts.
If new persistence columns or tables are required, add an explicit compatible migration under the owning Sites leaf.
Old publications must continue to render through defined defaults.
Saving a draft must not change the public site until publication.
Publish approved public data to the client's existing SQLite-bound projection.
Preserve SQLite identity, checksums, sequence protection, enquiries, status, audit activity, and restore behavior.
No remote SQLite transport or Cloudflare D1 capability is implied by this redesign.

### 8. Source structure and cleanup

Use small, cohesive LogicX components for the header, hero, technology strip, services overview, approach, sales sections, and footer.
Keep route composition in `LogicxSite.tsx` and keep shared client behavior in its existing public contracts.
Keep LogicX tokens and section styles scoped to LogicX.
Do not change shared portfolio styles in ways that alter Ramu Tex or standard clients.
Replace obsolete LogicX sections and selectors after their replacement passes visual review.
Avoid layering the new design over old overrides and duplicate theme implementations.
Keep only the existing four Markdown documents. Update this plan and `TASK.md` with exact progress.
Generated builds, archives, test captures, and caches belong under the root `dist` tree.

### 9. Delivery phases and review gates

| Phase | Work | Gate before the next phase |
| --- | --- | --- |
| 0. Plan | Record this masterplan and preserve the reference | User reviews the direction before implementation starts |
| 1. Visual foundation | Finalize asset compositions, palette, type, header, hero, mobile crop, technology strip, services, and approach | Compare desktop and mobile screenshots with the supplied design |
| 2. Homepage completion | Recompose catalogue, examples, industries, engagement options, FAQ, closing CTA, and footer | All links work, sections have distinct purposes, and no unsupported claims appear |
| 3. Full page family | Restyle services, service details, applications, app details, company, blog, support, contact, privacy, and 404 | Every route uses the same system and preserves its function |
| 4. Editorial connection | Add typed content contracts, Studio fields, defaults, and publication support | Draft, publish, SQLite import, reload, and cross-client isolation checks pass |
| 5. Verification and package | Run relevant checks, optimize assets, inspect SSR/SEO, verify enquiries, and create a new release package | Evidence below is complete, with skipped external checks named |

Implementation is authorized. Preserve existing drafts and client data during the redesign.
When implementation is requested, deliver complete phases in this order and show concrete screenshots at visual review gates.
Do not replace a working public package until the new package passes verification.

### 10. Acceptance and verification

Visual acceptance:

- Header, hero text block, monitor scale, photo treatment, technology strip, service carousel, and approach curve match the reference's composition.
- Text remains real HTML and fits across the specified widths without horizontal scrolling.
- No duplicate process section, repeated CTA wall, blank image, clipped curve, or unreadable photo overlay remains.
- The lower homepage and all inner pages use the same type, spacing, buttons, icons, and colors.
- Every service has a different relevant image. Hover, focus, touch, and reduced-motion behavior all work.

Functional acceptance:

- Every current route renders useful HTML with a correct heading, canonical URL, and metadata.
- Application search, category filters, navigation, FAQ, and prefilled contact links work.
- Contact submission persists to the correct client SQLite database and shows a receipt.
- The same enquiry appears only in that client's authorized Studio inbox, with existing status and deletion controls intact.
- Studio content survives save, publish, refresh, import, and process restart.
- Wrong-client access, stale revisions, invalid media, and unauthorized edits fail safely where affected.
- Start and Open retain their saved ports, exact client identity checks, and bounded development header limits.

Build and delivery acceptance:

- Relevant Sites type checks, lint, production builds, content tests, runtime tests, and packaged HTTP checks pass.
- Module boundaries, component documentation, and dependency layout checks pass or have concrete pre-existing blockers recorded.
- Sitemap, robots, favicon, light/dark logos, social metadata, and image paths exist in the final package.
- Measure page weight and loading behavior. Optimize the hero before publishing and lazy-load lower-page photography.
- Target LCP at most 2.5 seconds, CLS at most 0.1, and INP at most 200 ms. Report lab results separately from field data.
- Preserve the previous release for rollback. Do not include SQLite databases, credentials, or enquiry records in public artifacts.
- Report local verification separately from external hosting, DNS, TLS, remote delivery, and production deployment.

### 11. Inputs and defaults

Implementation can start with approved local company data and the current catalogue.
Use original imagery if licensed final photography is unavailable.
Do not block the visual build on unverified metrics, customer logos, testimonials, or project case studies.
Hide those claims until supplied and approved. Clearly label demonstration work.
Use the approach anchor until a real demo video exists.
Retain enquiry-led pricing until approved prices and sales terms exist.
Implementation and local acceptance evidence are recorded in `TASK.md`. External hosting and field performance remain separate verification boundaries.

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

Manage opens each client workspace with database-backed public profile, website sections, and blog editors. LogicX, Ramu Tex, and new standard clients use site-scoped content.
Start and Open controls use the saved client port. Local startup checks live `sites.site.runtime.start` permission.
The Sites overview identity adapter supplies that capability through its existing public host resolver.
All new source remains under Sites. The root lockfile records the Sites Web dependency on browser-safe API contracts.
Tenant permission seeding must register the new Start permission before the live button can launch a client.
Ramu Tex now has a typed homepage/profile draft and blog posts in tenant MariaDB, with separate published snapshots.
The local public reader connects through an authorized Start. Production target delivery remains planned.

The API already has overview and site registry modules with migration, seeds, and lifecycle routes.
The Web workspace exports Sites-owned overview and site management components for host composition.
The active clients are LogicX on port 7131 and Ramutex on port 7132.
Ramu Tex now has a responsive brochure-based portfolio with processing, finishes, equipment, company-profile claims, and contact information.
The enquiry form stores submissions in the client SQLite backend. The authenticated Studio inbox manages those records.
The bundled original brochure supplies the source facts and download.
The portfolio seed retires only the original CODEXSUN and Tech Media sample identities and adds Ramutex.
Existing databases require this updated seed. No table alteration is required.
The existing README describes an older foundation and understates this implementation.
Seeded status and page counts do not prove a deployed site is live.

Before production authoring, close these observed gaps:

- The site registry still needs its broader per-action audit. Page/blog actions use the Sites-owned public identity adapter.
- Keep editorial access on the current cookie session and public identity adapter. Public clients receive no editor token.
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
Ordinary Vite builds remain browser bundles. The deployment preparation command adds rendered routes, metadata, canonical URLs, and sitemap files.
The bundled Node server also renders current SQLite publications on each public request.

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

The original Phase 0 added a runnable local SQLite identity store under `clients/runtime/content`.
That initial store contained identity only. The deployment continuation adds approved snapshot storage and a Node hosting adapter.
The original SQLite initialization changed no MariaDB records. The current CMS slice creates four additive tenant tables through the existing Sites migration entry point.
Future site ownership changes require registered migrations that explicitly upgrade existing tables.
`CREATE TABLE IF NOT EXISTS` cannot add those fields to existing sites.

Run these commands from the repository root:

```sh
node apps/sites/clients/runtime/content/init.mjs c0de0004 storage/sites-data/ramutex/content.sqlite
node --test apps/sites/clients/runtime/content/content-store.test.mjs
```

This creates local development storage only. Use a persistent path outside build output in production.
The Node adapter does not run inside Workers. Phase 3 implements a separate D1 adapter.

## Cloudflare references

- [D1 overview](https://developers.cloudflare.com/d1/)
- [D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)
- [Worker static assets](https://developers.cloudflare.com/workers/static-assets/)

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
The Ramu Tex slice now implements profile/homepage drafts, blog drafts, publication snapshots, permissions, and local public reads.
The broader client membership model, custom page CRUD, rich-text preview, offline delivery, deployment, monitoring, and visual builder remain planned.
The affected site and child leaf ownership audit has run. The broader legacy registry authorization work remains open.

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

## Ramu Tex CMS ownership and acceptance

Page content is a single typed website aggregate, including its public business profile and sections. Home, About, Services, and Contact project this same saved publication.
The page leaf owns validation, persistence, revisions, publication, activity, seed content, and editor fields.
The blog leaf owns its records, URLs, draft/published content, activity, safe deletion, and editor.
Both leaves sit under the site owner and use public child exports for composition.
No generic entity registry or arbitrary module-path CRUD engine is introduced.

Publication in this slice is a synchronous tenant-database transaction. It performs no build, export, external delivery, or deployment.
Future target sync and remote deployment must use the queued delivery architecture above.
Public local reads use a server-bound tenant/site and publish projections. They cannot choose a tenant from request headers or query parameters.
All new implementation stays under Sites. The root lockfile records the public contract dependencies. The obsolete client source inventory dependency has been removed.

Current acceptance includes local MariaDB initialization, browser save/reload/publish, public-site rendering, and isolated database tests.
Do not extend this evidence to production hosting, D1, SQLite replication, or custom page CRUD.

## Standard portfolio continuation

Use one site registry identity for each client workspace in this slice.
Client registry creation and its initial page draft commit in one transaction.
New client templates use neutral defaults and empty service, contact, and blog collections where facts are unknown.
The general standard template and both named templates remain inside Sites.
The fixed public route set is Home, About, Services, Contact, Blog, and individual blog articles.
This does not implement arbitrary page creation, media libraries, or a visual page builder.

Local Start discovers the checkout by ascending directories, rather than assuming a fixed module depth.
The public reader holds one authenticated tenant/site binding per slug.
Each Vite process proxies public content to its own bound slug. Publication payloads include that slug for client validation.
The API restart clears bindings. Authorized Start restores them.
Published page counts derive from the website publication snapshot. The old count column remains for database compatibility.

Existing databases need the updated Sites seed for LogicX and the registry creation permission seed.
No column alteration is required for these route projections or the standard template.
Keep production target credentials, durable sync, SQLite/D1 delivery, and deployment jobs in the planned delivery phase.

## Node and SQLite deployment runbook

### Ownership and current delivery contract

The publication child leaf owns immutable MariaDB export records, validation, checksums, permissions, and the export route.
Its service receives only published page and blog projections through Site-owned composition.
A public export contains a monotonic database sequence and an opaque tenant/site key.
The key prevents seeded site UUIDs in different tenant databases from sharing one delivery database.
The export history is append-only. It has no editable CRUD form or fake seed data.
Manual artifact preparation is an operator command. It does not queue or perform a remote deployment.
Future automatic delivery and deployment must use the planned authenticated queue contracts.

The client enquiry leaf owns validation, SQLite tables, persistence, retention, rate limits, public submission, and its form.
It is a public submission surface, not a general CRUD workspace. It has no sample seed, public list, or browser administration endpoint.
Management commands are private host operations. They do not accept a browser-selected database or tenant.

Each runtime opens one configured database, validates its release identity, and applies only approved public snapshots.
An existing database rejects another opaque tenant/site key even when both tenants have the same seeded site UUID.
Newer snapshots replace the full public projection, including withdrawn or deleted blog posts.
A retry is idempotent. Stale or conflicting sequences fail. Checksums detect alteration but are not signatures.
Only use snapshots obtained through the authenticated Studio export action or another trusted operator channel.
The deployed runtime has no public import endpoint and no MariaDB connection.

### Prepare

1. Save and publish the intended profile, website sections, and blog posts in that client's Studio.
2. Use Export deployment content. This requires the live export permission.
3. From the repository root, run the preparation command in README.md with the downloaded JSON file.
4. Review `readiness.json`, the canonical origin, contact number, company location, and rendered pages.
5. Check the release checksum file after transfer. Keep the source export for recovery.

The output contains no live database. Branding assets and rendered HTML sit under its public directory.
The generated origin comes from the published business domain unless the operator supplies `--origin https://verified-host`.
Default host ports are 7131 for LogicX, 7132 for Ramu Tex, and 8080 for a new standard client.
Change the environment and nginx upstream together if the host needs another port.
No tool in this continuation registers domains, requests certificates, changes DNS, or sends data to an external hosting service.

### Native Linux host

1. Install Node 24 or newer and nginx on the target host.
2. Copy the prepared release to `/srv/codexsun-sites/<client>/<release-id>`.
3. Point `/srv/codexsun-sites/<client>/current` to that release.
4. Review the generated `site.service`. Install it as `/etc/systemd/system/codexsun-site-<client>.service`.
5. Run `systemctl daemon-reload` and enable/start that service.
6. Install the generated nginx configuration after provisioning the real certificate paths.
7. Validate nginx configuration, reload it, and check the real HTTPS hostname.

The systemd unit uses a dynamic service user and a private persistent state directory.
SQLite lives under `/var/lib/codexsun-sites/<client>/content.sqlite` and remains outside the release symlink.
The unit starts Node on loopback. nginx supplies TLS and forwards the canonical Host header.
The service uses the same-origin public content and enquiry endpoints. It does not require the development API.
The Node executable path and systemd features must be checked on the actual host before installation.

### Container host

1. Copy the release folder to the target host.
2. Copy `.env.example` to `.env` and confirm the canonical origin and unique host port.
3. Set the exact trusted proxy address when forwarding visitor IPs through a proxy.
4. Run `docker compose -p <client> up -d --build` inside that release.
5. Install the generated nginx configuration with the real TLS certificate.
6. Check container health and the public hostname before routing production traffic.

Each Compose project owns a separate `site-data` volume mounted at `/data`.
The image runs as the Node user, drops Linux capabilities, and uses a read-only application filesystem.
The SQLite volume remains writable. The health check sends the configured canonical Host header.
Do not run `down -v` as an application upgrade step. It deletes the client database and its enquiries.
A single local SQLite writer is the supported baseline. Do not use this package as a multi-replica shared-disk service.

### Backups and upgrades

Use the management CLI with the same `CODEXSUN_SITES_DB` as the running service.
The backup command uses SQLite's online backup API and refuses an existing target or a path inside the release.
Apply private file permissions and an appropriate backup retention schedule. Backup copies also contain enquiry data.
Before an upgrade, create and verify a backup. Retain the previous release directory and publication export.
Deploy the new package while preserving the existing state directory or volume.
Verify health, all public routes, sitemap, branding, contact submission, and the expected content sequence.
A public export never overwrites enquiry records.

### Rollback

Switch the application release symlink or container image back after checking schema compatibility.
Do not replace or delete the SQLite volume as part of an application rollback.
An older bundled snapshot cannot replace a newer database publication.
To intentionally restore earlier content, publish that content again in Studio and create a new export sequence.
Database recovery is a separate, explicit operator action against a verified backup.

### Contact operation

Successful submission means the enquiry was stored in this client's database. It does not mean an email was sent.
The private enquiry CLI lists up to 100 recent records and supports reference-specific deletion.
The public server removes records older than 90 days. The privacy page describes this behavior.
Exact-origin checks, JSON size limits, consent validation, a honeypot, idempotency keys, and persisted IP-hash rate limits protect submission.
The database stores no raw visitor IP. Only an HMAC rate key is retained for the rate window.
A proxy must overwrite forwarded IP headers. Only explicitly trusted socket addresses can supply a visitor address.
Do not expose the management CLI through an HTTP shell or publish database/backup files.

### Hosting limits and acceptance

This release targets Node and persistent SQLite. Cloudflare Workers need the separate D1 adapter from the hosting plan.
No Worker or remote deployment was completed in this continuation.
Studio now reads attached client SQLite stores through the protected enquiry module. External mail notification and remote enquiry transport remain planned.
The static HTML files are useful for indexing and fallback, but the SQLite backend and enquiry form require the Node runtime.
Real DNS, HTTPS certificates, nginx, systemd, and Docker execution require verification on the chosen deployment host.

Primary references:

- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google robots.txt guidance](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)
- [Node SQLite API](https://nodejs.org/api/sqlite.html)
- [WhatsApp click-to-chat format](https://faq.whatsapp.com/5913398998672934)

## Enquiries and LogicX completion — 2026-10-17

The Enquiry leaf owns SQLite migration, submission service, inbox queries, audit history, and protected routes.
Its public runtime export replaces the earlier client-owned persistence copies. There is one implementation of the enquiry tables.
The client runtime owns HTTP submission handling. Studio owns authenticated inbox presentation.
The parent Site module resolves live permissions, tenant context, and the saved site before opening storage.
No Platform implementation changes are required.

The SQLite v2 upgrade adds status, revision, update time, deletion time, activity, and inbox indexes.
The migration runs transactionally and preserves existing submissions. Requests reject stale revisions.
Deletion is recoverable trash. Retention purges enquiries and their activity after 90 days.
Manual message creation, visitor-message editing, and public inbox access are deliberately excluded.
The existing private CLI supports explicit permanent removal on the client host.

Local Start uses a TypeScript loader for the shared enquiry runtime and verifies the exact tenant/site identity.
Repeated Start tolerates a busy dependency build before reporting an error.
Studio and client runtimes share a server-selected data root and separate hashed client directories.
A deployed client can attach its data volume to Studio under that exact namespace.
Remote HTTP administration, enquiry synchronization, and D1 support require a separate authenticated adapter.
Do not imply that an attached filesystem adapter connects an arbitrary remote host.

LogicX now owns Home, About, Services, Contact, Blog, Privacy, Applications, Support, eight service details, and 23 application details.
The published page schema stores catalogue text. Application slugs must be unique.
Catalogue descriptions come from the repository app documentation and inventory, without importing private app code.
Application pages link to a prefilled LogicX enquiry or the existing Platform sign-in.
The shared public route contract drives prerendering, sitemap coverage, and saved page counts.
No automatic cross-app login, entitlement changes, app deployment, or production readiness claims are added.

LogicX uses a white, green, and charcoal visual system inspired by https://themes.muffingroup.com/be/itservice/. Use original software artwork, outlined service icons, spacious cards, and responsive layouts. Keep published content, catalogue routes, contact submission, and client isolation connected.

LogicX marketing sections describe enquiry-led software projects, ERP integration, and support engagements. Avoid invented customer statistics, testimonials, prices, delivery guarantees, or checkout claims. Use distinct original local artwork for each service and preserve keyboard, touch, and reduced-motion behavior.


## Corrected LogicX redesign implementation record — 2026-10-17

The current source replaces the old laptop illustration, service grid, repeated process sections, and duplicate banner styles.
The hero uses curved diagonal layers, an original architecture crop, and a code-owned tilted software demonstration panel.
The service carousel shows four items on desktop, two on tablet, and one main card on mobile.
The complete Services page retains image previews on hover, focus, and touch layouts.
The approach, catalogue, examples, industries, engagements, FAQ, CTA, footer, and inner pages use the same scoped design system.

Marketing content uses the existing Page leaf JSON aggregate and publication mechanism.
The field is optional for compatibility. Older publications render through code-owned defaults without changing their checksums.
Studio saves the full typed marketing projection. Deployed local image paths are allowlisted.
The fixed CTA destinations prevent content from introducing arbitrary executable links.
The existing MariaDB authoring record and client SQLite ownership remain unchanged.

Local verification covered Studio editing, save, publish, client delivery, reload, and restoration of the verification heading.
A live contact form submission reached only LogicX's SQLite inbox. Status and trash controls passed.
The verification record was trashed. Existing enquiries were preserved.
Ramu Tex's saved page was compared before and after LogicX publication and remained unchanged.

The current package was checked across all 39 published routes and five homepage viewport widths.
Formal field Core Web Vitals, external hosting, production DNS, TLS, and remote delivery were not verified.
The optimized architecture asset is about 391 KB. No production speed score is claimed.
The dependency-layout check still reports pre-existing nested build folders in Sites and Tconnect.

Image provenance: built-in image generator, original project asset.
Final prompt: "Portrait 2:3 premium editorial architectural photograph. Minimal pale concrete courtyard with tall slim leafy tree, warm neutral stone wall textures, strong angled sunlight and shadows, deep green lush tropical garden planting at bottom third. Upper two thirds concrete architecture and tree. No people, no text, no logos, no furniture, no computers. Forest green and warm ivory palette. Photorealistic background asset for software studio web design, will be cropped into abstract diagonal shapes. Only photograph, not a website mockup."
Final asset: `apps/sites/clients/public/logicx/design/logicx-architecture.webp`.
The earlier monitor-and-desk generated images were not used in this design.
Studio media and service selectors use friendly labels. File paths and service slugs remain internal publication values.

### 2026-10-17 growth-section refinement
Implemented editorial workflow stories, navy/copper industry expertise, and an indigo delivery sequence. Content is editable through the existing marketing collections in Studio and published locally at revision 17. Responsive packaged-browser and content checks passed. The manually launched preview still needs Studio Start binding for live public-content reads; external deployment is not verified.


## Cloudflare Worker delivery - 17-10-2026

LogicX now has a separate Cloudflare Worker delivery adapter and dedicated D1 enquiry database.
See the README deployment commands and TASK verification record for the deployed version and evidence.
The adapter consumes only an authenticated published export and serves 39 prerendered routes.
It never connects the public Worker to tenant MariaDB or exposes Studio credentials.
D1 writes retain strict input validation, exact-origin checks, consent, idempotency, atomic rate limits, and 90-day retention.
The shared SQLite implementation remains unchanged for ordinary hosts.

Manual promotion is implemented. Automated deployment queues, publication replication, remote D1 inbox integration, and email notification remain planned.
A future remote inbox must resolve the authenticated tenant/site and enforce live Sites permissions before selecting D1.
Do not add a public enquiry-list or import endpoint as a shortcut.
Preserve D1 during application upgrades and check schema compatibility before Worker rollback.

### Ramu Tex presentation baseline — 2026-10-17

The Ramu Tex client now owns a consistent six-page portfolio with navy, ivory, and copper styling.
Its shared header, footer, material imagery, reading layouts, and mobile navigation stay inside Sites.
Published page and blog projections remain the content authority. No storage schema or permission change is required.
Phone, tablet, desktop, production client-build, and isolated enquiry checks passed. External delivery remains a separate deployment gate.
New artwork uses the built-in image generator. It depicts navy, ivory, and copper fabric folds and swatches with yarn cones.
Final assets are fabric-sculpture-navy.webp and material-study-navy.webp under clients/public/ramutex/ramutex.

## 2026-10-17 public-site performance audit

Scope: Sites client delivery, LogicX homepage and route composition, styles/fonts, motion, static assets, SSR, publication refresh, Node runtime and deployment proxy. This is not a complete security review of every Studio business module or the repository.

Measured with packaged Node/SQLite delivery in isolated headless Chrome: 390x844 viewport, 4x CPU slowdown, 150ms latency, 200000 bytes/second download, disabled HTTP cache, three fresh contexts per build. Measurements are local lab medians, not field data or production guarantees. Long-task totals use a five-second observer window and are not Lighthouse TBT or real-user INP.

| Metric | Before | After |
| --- | ---: | ---: |
| First contentful paint | 7.404s | 1.880s |
| Largest contentful paint | 7.420s | 2.060s |
| Transferred subresources | 1,347,134 bytes | 345,772 bytes |
| Layout shift | 0 | 0 |
| Render-blocking CSS, raw | 357,525 bytes | about 55,900 bytes |
| Main JavaScript, raw | 531,277 bytes | about 472,000 bytes |

Fixed:
- Public clients no longer import the Platform-wide stylesheet and scan unrelated apps. Added a small public reset and one locally hosted Latin font with optional display; retained font licensing.
- Deferred Motion animation features into their own chunk with LazyMotion. Content remains rendered and visible before animation code arrives.
- Removed hidden SSR states from service, application and growth cards. Kept a gentle transform reveal and hover effects after hydration.
- Hero entrance begins visibly instead of waiting for an opacity-zero animation.
- Reused bootstrap publication data without an immediate duplicate fetch; background refresh and client identity validation remain.
- Optimized the architecture image and served a 640px version for mobile hero and approach imagery.
- Added gzip negotiation for eligible text responses, bounded static-file caching and reusable compressed static buffers. Preserved no-store HTML/content and immutable hashed assets. Added proxy gzip configuration.

Verification:
- Client typecheck/lint, root component-document checks and five SQLite/runtime unit tests passed.
- Explicitly enabled packaged HTTP test passed for LogicX and Ramu Tex: route rendering, origin rejection, enquiry persistence/idempotency/isolation, restart recovery, publication replacement and gzip negotiation.
- Browser checks passed for hydration, mobile overflow, responsive image selection, eight application cards, contact-form submission, cache headers, gzip;q=0 and visible content with JavaScript disabled. Desktop and mobile screenshots reviewed.
- DevTools MCP tools were available but its Chrome profile was locked by another session. Used a separate Chrome instance with Playwright/CDP throttling and PerformanceObserver instead.

Remaining limits and blockers:
- dependencies:check reports the existing apps/tconnect/web/dist directory. It was not modified or removed.
- The manually launched development preview still needs authorized Studio Start binding for live content reads. Packaged SQLite delivery is working; this is separate from production page speed.
- Main JavaScript still includes React, schema validation and several route templates. Further route/island splitting is a follow-up, with SSR/hydration compatibility tests required. It was not reduced by weakening validation.
- Local long-task totals were noisy under concurrent workstation activity. Production INP, field data, CDN/TLS and remote TTFB are not measured. No Lighthouse performance score is claimed.
- External deployment, nginx execution and Cloudflare hosting were not verified in this audit.

References: https://web.dev/articles/optimize-lcp and https://motion.dev/docs/react-reduce-bundle-size . Raw measurements, logs and screenshots are under root dist/apps/sites/verification and are generated local evidence.

## Two-site Cloudflare delivery - 17-10-2026

Ramu Tex now has a separate Worker, static release, custom domain, and D1 enquiry database.
LogicX and Ramu Tex share only the transport implementation. Entry points, origin checks, publication data, and database bindings remain separate.
The preparation and live verification commands accept only the two approved client slugs.
Shared transport tests reject the other client's hostname and cross-origin enquiry submissions.
Manual deployment and the remote inbox limitations above remain unchanged.

### Ramu Tex fabric content and imagery — 2026-10-17

The Ramu Tex client owns the new hosiery and polyester sports fabric guide.
The guide stays in its template and does not modify a client's immutable publication or company capability claims.
Images are illustrative material and application studies. Order suitability, processing routes, and finishes require a sample brief.

Reference reading:
- https://cottonworks.com/learning-hub/knitting/single-and-double-knits/
- https://cottonworks.com/product-innovation/digital-cotton-basics/
- https://cottonworks.com/learning-hub/quality-assurance/shrinking-and-skewing/
- https://members.aatcc.org/store/tm217/4012/
- https://www.hohenstein.us/en-us/textile-testing/quality/textile-and-chemical-tests/
- https://textileexchange.org/polyester/

Image generation used the built-in tool. Each prompt produced one original photograph.
Final delivery files are under `clients/public/ramutex/ramutex`, with a matching `-640.webp` variant for each file.

- `hosiery-materials.webp`: Landscape 1536x1024 premium editorial textile photograph. Cotton knitted hosiery fabric swatches: creamy ivory fine single jersey draped in soft loops, a folded denim blue interlock knit, muted copper rib fabric with clearly visible vertical ribs. A cotton yarn cone on pale limestone. Macro tactile loop stitches and real soft cotton fibres, gentle natural side light, clean restrained luxury Apple product photography art direction, warm ivory seamless studio, rich navy accents. No green, people, text, logos, watermarks, factory or collage. Composition fills lower two thirds with breathing room. Original illustrative material study for a textile processing website, not a company stock or facility photograph.
- `sports-materials.webp`: Landscape 1536x1024 extraordinary premium textile product photograph. Navy polyester sports jersey folded in sculptural waves alongside a section of pale slate blue breathable birdseye mesh and copper micro polyester knit. Close enough to show the different knit surfaces and regular small mesh apertures, realistic smooth technical textile sheen, no fake water droplets or glowing effects. Minimal warm ivory studio background with pale stone block. Controlled directional softbox light like Apple premium product photography. Sophisticated navy, denim, ivory and copper palette only. No green, text, logos, people, branding, collage or factory. Original illustrative sports fabric study for a textile processing portfolio.
- `hosiery-applications.webp`: Landscape 1536x1024 luxury textile editorial still life. Unbranded folded ivory cotton crewneck T-shirt with a neat ribbed neckline, folded navy soft cotton lounge trousers and one copper rib knit fabric swatch on a pale warm stone surface. Fine cotton knit stitch detail, quiet generous composition, soft morning side light, natural plausible garment proportions, no print, no labels, no people. Elevated Apple catalogue photography quality, cream navy copper palette, no green, text, logos, watermarks or collage. Illustrative garment application study, not a client's product or claimed manufacturing output.
- `sports-applications.webp`: Landscape 1536x1024 luxury editorial sports textile still life. A single unbranded midnight navy short sleeve athletic training shirt neatly laid on a warm ivory surface, a subtle slate blue mesh ventilation panel visible along one side seam, folded copper technical knit fabric next to it, small unbranded pale stone exercise block at far background. Macro visible fine polyester knit, refined fabric drape, photographic realistic cloth, soft dramatic side lighting. Premium Apple product catalogue art direction with breathing room. No green, text, logos, people, medals, watermarks, collage or false performance effects. Illustrative activewear application study, not company stock or a client project.

### Live Ramu Tex fabric release - 17-10-2026

The latest fabric guide and all eight image variants are deployed externally.
The Worker serves export sequence 21 at ramutex.codexsun.com.
Mobile viewport checks passed for all six routes at 320, 390, and 430px.
Four responsive fabric images, menu behavior, fabric details, enquiry prefilling, and persisted mobile submission were verified live.
The Studio domain metadata blocker is resolved. Manual promotion and remote inbox limitations remain unchanged.
