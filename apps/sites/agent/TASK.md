# Site Studio task and working rules

## Client workspace task

Manage must open the selected portfolio's Studio within Sites, with client details, pages, and blogs.
Start and Open must use the saved client port. Starting requires local development and live authorization.
LogicX, Ramu Tex, and new standard portfolios have database-backed public profile, website sections, and blog editors.
Keep startup controls separate from deployment jobs. Local development startup must not become a production process launcher.

Implementation evidence: client Studio, source inventory, Start/Open controls, and a local authenticated startup route exist under Sites.
Automated tests cover missing identity, denied permission, repeated live authorization, host isolation, startup validation, and real Vite startup.
The three local clients returned HTTP 200 on ports 7130, 7131, and 7132 during this task.
Those checks were absent from the initial foundation. The CMS continuation initializes the registered local tenant and verifies signed-in editing.

## Read order

1. Read the repository agent guide and governance rules.
2. Read [the development skills and workflow](SKILLS.md).
3. Read [the architecture and work plan](PLAN.md).
4. Inspect the affected module, public exports, tests, and host references before editing.

## Ownership

Site Studio is an application owned by `apps/sites`.
Platform identity supplies authenticated actor, tenant, and authorization capabilities through public contracts.
Sites owns its business permissions and enforcement, data, UI, migrations, workers, deployment logic, and tests.
Keep all new Studio source and configuration inside this app.
Use the repository root for npm commands, dependencies, and generated build output.

Platform currently contains host registration, context adapters, migration/seed invocation, and screen mounting.
Do not expand those references into Studio implementation.
If a generic host contract is missing, record the exact dependency before proposing a host change.
Do not import Platform private files into Sites.

## Storage and identity

Studio authoring data belongs in the authenticated tenant's MariaDB database.
A client within an agency tenant is not another Platform tenant.
Enforce client and site membership in addition to tenant isolation.
Ordinary client servers use site-specific SQLite stores. Workers use a separate D1 adapter.
Public clients receive published content only. They never receive tenant database credentials or Studio session tokens.
Use Platform's current session contract. Do not copy browser token storage from the existing CMS helper.

## Working agreement

Keep architecture, phase acceptance gates, and the execution sequence together in [PLAN.md](PLAN.md).
Keep app information in `apps/sites/README.md`. Keep every other Sites Markdown file under `apps/sites/agent`.
Use `apps/sites/README.md` as the single README and link this task file from it.
Keep agent documentation flat: `TASK.md` for scope and working rules, `PLAN.md` for architecture and execution, and `SKILLS.md` for workflow.
Do not add an agent README, another app-level `AGENTS.md`, or a nested skills folder.
Agent instructions and skills never grant runtime permissions or weaken backend checks.
Update status only when implementation and verification support it.
Do not create placeholder modules, fake deployment states, or fabricated content.
Apply repository verification gates appropriate to the actual change.
Report missing contracts, migration prerequisites, and skipped checks explicitly.

These files guide development agents. They are not runtime business-chat instructions and are not loaded by the API.

## Active client change

Keep LogicX and replace the CODEXSUN and Tech Media sample portfolios with Ramutex.
Ramutex uses port 7132 and theme `portfolio-ramutex`. Its company profile supplies the business domain `ramumag.com`.
Its home page now uses the supplied company profile, with no invented customer claims or blog posts.
Retain old source files outside the active exports and builds.
The earlier default database setting was stale. The CMS continuation uses the authoritative registry and applies the updated local seed.

## Ramu Tex portfolio from the company profile

Source: `clients/src/clients/ramutex/assets/ramu-tex-company-profile.pdf` within Sites.
Use the printed business name Ramu Tex Processors India Inc and the listed domain `ramumag.com`.
Keep the internal client slug `ramutex` and local development port 7132.
The brochure supplies machinery, fibre types, seven specialty finishes, address, phones, emails, and GSTIN.
Present certification and environmental references as company-profile claims. No current certification lookup has run.
Do not invent customers, testimonials, production capacity, establishment dates, or blogs.
The enquiry form prepares an email draft. It does not submit to an API or send mail automatically.
The original profile is available as a download on the public website.

## CMS continuation evidence

The registered local tenant now has the Sites CMS tables, brochure draft, and new permission grants.
Live Platform login opened all three workspace tabs without browser errors.
A browser save survived a full reload from MariaDB. Publishing changed the local website.
The original brochure wording was restored and republished after the verification edit.
Isolated MariaDB tests verify actual DDL, repeatable seeds, revision conflicts, publication, site isolation, withdrawal, and safe deletion.
SQLite-backed SQL tests additionally verify transactional audit behavior, denied HTTP actions, invalid input, and separate tenant databases.
Local public delivery remains bound through an authorized Start and must be rebound after an API restart.
Production targets, custom page CRUD, rich text, media uploads, and offline SQLite/D1 delivery remain separate planned work.

Final CMS checks: ten automated tests passed with MariaDB verification enabled and no skipped tests.
Sites API, Web, and client builds passed, along with the Platform Web composition build.
The blog browser test verified required controls, draft save/reload, private-draft isolation, and deletion. Its temporary draft was removed.
Local runtime launch and public content binding were verified through an authenticated Start request.

## Standard portfolios and Start repair — 2026-10-16

Completed source and local database work:

- Replaced fixed-depth checkout resolution with upward discovery from source, compiled output, and host working directories.
- Connected LogicX to its own saved profile, sections, blogs, and publication state.
- Added Home, About, Services, Contact, Blog, and article routes for both clients and the standard template.
- Connected public reads through separate server-bound client identities and matching per-client Vite proxies.
- Added direct Add Portfolio creation, required-field feedback, standard template defaults, and atomic initial workspace persistence.
- Added site settings and duplicate registered port checks. New clients await their first publication.
- Removed the obsolete source-only Studio inventory and its Web dependency.
- Initialized LogicX in the registered local tenant through the authoritative tenant registry and secret reference.
- Retained Ramu Tex's existing saved and published brochure content.

Verification evidence:

- Thirteen CMS, identity, runtime, and MariaDB tests passed with no skips.
- Two SQLite identity-store tests passed.
- Sites API, Web, named client, and standard template production builds passed. Platform Web composition build passed.
- Sites type checks, lint, module boundaries, root dependency layout, and component documentation checks passed.
- Browser checks exercised Add Portfolio validation and the LogicX editor's save, reload, draft isolation, and publication.
- Both clients' five public pages returned their own published content and fitted a 390-pixel viewport.
- A separate public browser run completed without page errors.
- Original LogicX wording was restored and republished after the verification edit.

Local development behavior is verified. Production hosting and durable content delivery remain planned.

## Deployment preparation — 2026-10-17

Implemented:

- An authenticated export action with immutable MariaDB publication sequences and tenant/site-bound delivery identity.
- Node/SQLite client packages with independent persistent content and enquiry storage.
- Server-rendered and prerendered Home, About, Services, Contact, Blog, Privacy, and published article pages.
- Sitemap and robots files, requested aliases, canonical and social metadata, favicons, manifests, and public light/dark logos.
- Actual contact submission, validation, origin/body checks, consent, safe retry, rate limits, and 90-day retention.
- Private enquiry listing/deletion and online SQLite backup commands.
- Map loading on visitor request, directions links, and client-specific floating WhatsApp enquiries.
- Core company phone import into the selected site's draft, without automatic tenant-company assignment.
- LogicX phone and WhatsApp set to the user-approved +91 96552 27738. Its map uses company search, pending a precise address.
- Ramu Tex retains its published brochure facts and company contact details.
- Docker, nginx, systemd, environment examples, readiness output, and file checksum manifests.
- Production build wrappers that prevent the development NODE_ENV from leaking development controls into release output.

Verification includes isolated SQLite enquiry persistence, wrong-site/tenant checks, snapshot integrity, stale/conflicting imports, idempotency, rate limits, retention, and HTTP serving.
Packaged server tests verify rendered HTML, metadata, assets, private-file denial, origin checks, restart persistence, and blog withdrawal.
Browser checks verify contact validation and saving, map consent controls, WhatsApp links, canonical metadata, hydration, and responsive page widths.
All browser test enquiries use temporary databases and are removed after verification.

The prepared artifacts are local. No domain, certificate, external server, Docker engine, or systemd host was changed.
Mail notification and automatic enquiry transfer back to Studio are not implemented.

Final verification for this preparation:

- 14 CMS, authorization, runtime, and live isolated MariaDB tests passed without skips.
- Five SQLite unit tests and the packaged HTTP integration test passed.
- Both packaged sites passed six-page mobile browser checks, hydration, contact saving, and WhatsApp link checks. Production pages exclude development controls.
- Private status, enquiry listing, and SQLite backup commands passed against temporary databases.
- Sites type checks and lint, Sites module boundaries, root dependency layout, generic template build with an explicit client slug, and Platform Web build passed.
- The repository-wide component documentation check is blocked by missing documentation in unrelated apps/tconnect. Sites retains exactly its four required Markdown files.
- Docker, nginx, systemd, public DNS/TLS, and external hosting remain unverified.

## Client enquiries and LogicX software site — 2026-10-17

Implemented inside Sites:

- A private Enquiries tab for each saved client, connected to its tenant/site-specific SQLite store.
- Search, status filters, pagination, detailed view, status editing, trash, restore, and actor activity.
- Live per-action permission checks, exact storage namespace checks, revision conflicts, and private responses.
- One shared enquiry persistence owner, a transactional SQLite v2 upgrade, and retention of existing visitor messages.
- A new LogicX theme with software, Frappe/ERPNext, React, mobile, automation, integration, website, and support services.
- Eight service detail pages, a support page, and 23 editable application descriptions and detail pages.
- Application search and category filters, prefilled enquiries, Platform sign-in links, and shared route/sitemap coverage.
- The local LogicX page is saved and published with 39 routes. Ramu Tex retains its six standard routes.
- Repeated Start handles a busy dependency build. Source previews load the shared TypeScript enquiry runtime.

Verification evidence:

- Seventeen API CMS, identity, publication, enquiry, startup, and isolated MariaDB tests passed without skips.
- Five SQLite submission and delivery tests passed. The packaged HTTP integration test passed.
- Browser verification submitted an enquiry to each live client and checked its own Studio inbox, view, status, trash, and restore.
- Cross-client detail access returned 404. Saved status and activity were checked through the protected API.
- Only verification enquiries were removed after the live checks. Existing client enquiries were preserved.
- All 39 LogicX and six Ramu Tex routes passed rendered HTML, canonical metadata, sitemap, hydration, and mobile-width checks.
- Application search and Finance filtering passed. An unknown production application path returned 404.
- Sites builds, type checks, lint, module boundaries, dependency layout, component documentation checks, and documentation tests passed.

The Studio inbox supports local or attached SQLite data directories. Remote-host transport and Cloudflare D1 are not implemented.
No app entitlements, production DNS, certificates, or external deployment were changed.

Final presentation checks: Platform Web production build passed. LogicX registry details now use LogicX Software.
The Enquiries controls use Sites-scoped theme colors for readable search, filters, and pagination.
The workspace test command loads the root environment so opt-in MariaDB tests also run through npm workspaces.
Both local previews remain on 7131 and 7132. Updated release archives are under root dist.

2026-10-17: Restyled all LogicX pages with white and green sections, outlined service cards, original laptop artwork, a company approach band, and a charcoal footer. Verified 39 routes on desktop and mobile, successful contact submission, and no browser errors. Client typecheck, lint, production packaging, and both-client packaged HTTP/SQLite checks passed.

2026-10-17: Replaced LogicX service cards with spacious minimal portfolio rows on Home and Services. Original local software previews appear on hover and keyboard focus, remain visible on touch screens, and respect reduced motion. Service content and detail links remain connected to the published page data.
Verification: client typecheck, lint, production build, and packaging passed. Browser checks passed for all eight service links, hidden/revealed previews, keyboard focus, loaded images, mobile preview visibility, overflow, and browser errors.

2026-10-17: Added eight distinct local SVG service illustrations and smoother eased fade/slide previews. Expanded the LogicX homepage with a workflow consultation banner, three engagement options, four industry use cases, an application discovery banner, and five native expandable FAQs. Enquiry calls to action prefill the existing contact form. These new marketing sections are template content; existing service and application data still comes from the published Studio projection. Verified loaded images, hover/focus, responsive widths, reduced motion, FAQ expansion, CTA prefilling, typecheck, lint, and production packaging.

2026-10-17: Fixed local client preview HTTP 431 errors by setting a bounded 256 KiB Node header limit in the LogicX, Ramu Tex, and standard portfolio dev scripts and Studio runtime launch. All five runtime tests passed, including a real request with a 32 KiB cookie header.


2026-10-17: Completed the corrected abstract green LogicX design and replaced the masterplan reference image.
All implementation remains inside Sites. The design includes a tilted software panel, curved service carousel, dark approach section, catalogue, workflow examples, industries, engagement options, FAQ, CTA, and footer.
All new marketing sections now use an optional typed Page content field and a matching Studio editor.
Existing service descriptions, applications, profile, hero, approach, blogs, and contact data retain their Page and Blog owners.
No SQL alteration is required. Legacy content without marketing fields remains valid.

Verification:

- Sites API, Web, and Clients type checks and lint passed. API and Web builds passed.
- The composed Platform Web production build passed without Platform source changes.
- Fourteen CMS, identity, publication, enquiry, schema, and isolated MariaDB tests passed without skips.
- Five client startup tests and five client SQLite tests passed. Both-client packaged HTTP integration passed.
- All 39 LogicX routes passed rendered browser checks. Homepage overflow checks passed at 360, 390, 768, 1024, and 1440 px.
- Carousel controls, mobile navigation Escape behavior, public form submission, and prefilled enquiry passed.
- Live Studio editing, save, publish, public client delivery, original heading restoration, and reload persistence passed.
- A live form enquiry reached its own SQLite inbox. Status update, trash, and wrong-client 404 passed.
- Only the verification enquiry was trashed. Ramu Tex page data remained unchanged.
- Module boundaries and component documentation passed.

The dependency-layout check remains blocked by pre-existing `apps/sites/clients/dist`, `apps/sites/web/dist`, and `apps/tconnect/web/dist` folders.
Formal field performance and external deployment checks were not run.
The prior LogicX release archive was preserved under root dist for rollback.
Final Studio polish: image and service controls show friendly choices. Browser selection and restoration passed. The composed production build passed again after this editor change. The package uses the latest exported publication, and the live 7131 reader returned its published marketing content.

2026-10-17: Integrated the user-supplied LogicX SVG mark from logo 2.svg. Preserved its three paths and navy/blue colors. Added branded header and footer lockups, a light footer variant, dashboard mark, favicons, app icons, and sharing image. The deploy asset generator reads the Sites-owned vector source so builds retain it. Client typecheck, lint, packaging, and desktop/mobile browser branding checks passed. No page content or enquiry data changed.

### 2026-10-17 — LogicX logo palette
- Applied approved forest green (#004632) and mint (#60DFA0) to generated logos, marks, favicons, app icons and sharing image. Original SVG geometry and master remain preserved.
- Verified deployment build, all branding assets, desktop/mobile rendering and browser errors with the packaged runtime.


2026-10-17: Matched Platform public-page interaction tone in LogicX. Hero text cycles through the saved hero and first two service descriptions while visual and CTAs stay fixed. Trusted technologies now uses a full-width labelled marquee from saved marketing data. Added slide selection, pause, focus/hover pause and reduced-motion support. Client typecheck/lint and packaged desktop/mobile checks passed, including slide selection and reduced-motion marquee behaviour. All source changes remain in apps/sites.


2026-10-17: Removed shared title-row spacing from hero slides. Each description follows its own heading with a consistent 20px gap; overlaid slides retain stable overall height. Updated hero headings to Segoe UI Display with medium weight and balanced wrapping. Packaged browser checks verified all three slides at 1280, 768 and 390px: stable CTA position, consistent heading/description gaps, two-line descriptions and no horizontal overflow. Screenshots reviewed locally.


2026-10-17: Replaced positional technology symbols with explicit name-to-logo mapping for Frappe, ERPNext, React, Tailwind CSS, Python and Node.js. Vendor SVGs are stored locally in public/logicx/technologies; sources.json records official upstream URLs. Unmapped technology names display text only. Typecheck, lint, deployment build and packaged browser checks passed for all six loaded logos and mobile overflow.


2026-10-17: Services carousel shows four full cards and 20 percent of the fifth on desktop. At the end it shows the previous card peek on the left, with boundary arrows disabled correctly. Replaced positional service icons with name-based mappings and official Frappe, ERPNext and React assets. Packaged browser geometry checks, logo loading, desktop screenshot and mobile overflow checks passed; typecheck and lint passed.


2026-10-17: Added 20px desktop service-card gaps, more heading/card padding and section breathing room. Preserved four full cards plus 20 percent preview and boundary controls. Added once-only scroll reveals, hover lift, border/shadow and link-arrow motion with reduced-motion support. Packaged geometry, hover/reveal, responsive and browser-error checks passed; client typecheck and lint passed.


2026-10-17: Homepage application collection now shows only CRM, Billing, Accounts, Ecommerce, Q Cafe, HRMS, Chat and Zetro in that order. Cards render saved publication summaries and matching app-registry icons, with the CRM brand asset copied into Sites public assets. Full catalogue remains available through existing links. Client typecheck, lint, deployment build and packaged browser assertions passed for exact list, descriptions, icons, eight detail routes and mobile overflow. Temporary browser-test database cleanup encountered Windows EPERM after assertions completed.


2026-10-17: Applications catalogue now shares the exact eight-app collection, ordering, labels and app icons with the homepage. Categories and result counts derive only from those eight apps. Saved CMS descriptions remain the source. Typecheck, lint, deployment build and browser assertions passed for homepage/catalogue parity, count, search, Finance filter, all selected detail links and mobile overflow.


2026-10-17: Homepage and Applications now render one shared application-card component with consistent icons, saved descriptions, title sizing and enquiry/detail links. Refined padding, card gaps, equal row heights and mobile layout. Added once-only staggered scroll reveals, hover lift, soft border/shadow and arrow movement with reduced-motion support. Typecheck, lint, deployment build and packaged browser assertions passed for catalogue/home description parity, eight-app order, search/filter, detail routes, reveal/hover and mobile overflow.


2026-10-17: Redesigned Software in practice, Built around real operations and A practical way forward. Added four editable workflow stories (textiles, handloom/knitting, CRM and digital/social presence), a navy/copper industry section, and an indigo-accented discovery/delivery/evolution sequence. Spacious responsive typography, pastel diagrams, once-only scroll reveals, hover details and reduced-motion support are implemented. Updated only the six corresponding marketing fields through PageService in the verified local LogicX workspace; saved/published revision 17 and exported publication sequence 12. Other client/profile/application data was preserved. Client/API typecheck and lint, deployment packaging and browser checks passed; CMS tests: 13 passed, one optional MariaDB integration test skipped. Verified desktop/tablet/mobile, 11 panels, enquiry URLs, reveal/hover and no browser errors. Existing manually launched 7131 preview has an unbound Studio public-content route (404); packaged SQLite delivery is verified. No external deployment performed.


2026-10-17: Used the supplied images as inspiration only. Added an original generated textile-workshop photo, optimized to a 92 KB WebP, plus soft architectural backdrops on the existing three growth sections. Text remains HTML over masked decorative imagery; existing layouts and animations are preserved. Added allowlisted optional backdrop fields and Studio image/hide controls. Saved/published only these three fields in local LogicX revision 18, publication sequence 13. Client/Web/API typechecks and lint passed; CMS tests 13 passed, optional MariaDB integration test skipped. Packaged desktop/mobile screenshots, three loaded backdrop assets, responsive layout, enquiry links and reduced-motion checks passed. No external deployment performed.


2026-10-17: Replaced Software in practice step lists with original Sites-owned circuit/beam workflow boards inspired by the supplied snippets and screenshot. No registry component or dependency was installed. Nodes follow the saved ordered steps, map known steps to appropriate icons, resize with their container and connect with SVG traces and travelling light beams. Added per-board play/pause, off-screen suspension, accessible ordered labels and reduced-motion static rendering. Generated a new connected-workspace backdrop, optimized it locally, added it to the media allowlist and published only the practice backdrop in local revision 19 / sequence 14. Client/API typecheck and lint passed; CMS tests 13 passed with one optional integration test skipped. Packaged browser checks verified 4 boards, 16 step labels, beams, pause/play, reduced motion, new image, links and responsive fit. All implementation stays in apps/sites.


2026-10-17: Refined Software in practice with distinct straight, curved, inward-return and arc beam patterns. Added navy canvases, blue/purple/amber/emerald neon gradients, glowing nodes and varied node shapes. Saved step ordering, accurate icons, pause/play, off-screen suspension and reduced-motion static rendering remain intact. Client typecheck/lint, deployment build and packaged desktop/mobile board checks passed.


2026-10-17: Removed Connected workflow labels and compacted board controls. Reviewed homepage copy across hero, services, approach, applications, workflow stories, industries, delivery, FAQ, CTA and footer. Replaced generic/repeated prose with concise LogicX-specific software, ERP, automation and support content. Preserved profile/contact identity, eight-app selection, image choices and saved workflow steps. Removed duplicate visible technology wordmarks and shortened the HRMS summary consistently. Saved/published local LogicX revision 21 and export sequence 16. Client/API typecheck/lint, packaging, CMS tests (13 passed, one optional integration skipped) and full-page/desktop/mobile browser checks passed. No external deployment.


### 2026-10-17 — Ramu Tex portfolio presentation

- Added a centered editorial hero, rounded photographic panels, a two-route capability portfolio, and a fabric enquiry link.
- Used LogicX section rhythm and T Connect textile storytelling as references. Added two original generated material studies.
- Kept brochure facts, published content readers, contact forms, maps, privacy, and company profile downloads.
- Matched inner-page colors, typography, panels, and actions through a Ramu Tex wrapper.
- Client typecheck, lint, production build, module boundaries, component documentation checks, and documentation tests passed.
- The production build required the existing tsx loader: node --import tsx apps/sites/clients/deploy/build.mjs ramutex.
- Browser checks confirmed desktop image loading, portfolio navigation, Services content, and no horizontal overflow at 1280px.
- Mobile browser verification, enquiry submission, live CMS writes, and external deployment were not performed.
- Root dependency checks found existing output folders in apps/sites/clients/cloudflare/dist and apps/tconnect/web/dist.
- New portfolio copy and imagery are template-owned. Existing processing descriptions remain publication-owned. No database change is required.

## LogicX Cloudflare deployment - 17-10-2026

Published https://logicx.codexsun.com with Worker `codexsun-sites-logicx`.
The active Worker version is `9153b0c4-51c5-44b4-876d-3422eec64892`.
The deployment uses authenticated Studio export sequence 17, site UUID `c0de0002`, and all 39 published routes.
Site Studio registry now records `logicx.codexsun.com` as the primary domain.
The content profile retains its approved LogicX email, phone, and business-domain text.
Canonical metadata and the sitemap use the deployment origin.

The Sites-owned Worker serves a fixed published projection and prerendered assets.
The Enquiry leaf owns the asynchronous D1 repository and service through a public package export.
Dedicated D1 database: `72202591-6faf-4c6c-8bed-4b9b4086f04d`.
First deployment created the schema and bound it to the export's site UUID and opaque site key.
Cloudflare management credentials stay in Wrangler's existing OAuth store.

Verified live DNS resolution, HTTPS, custom-domain binding, health with D1 identity, all 39 routes, 17 homepage assets, canonical URLs, sitemap, robots, 404, and rejected invalid/cross-origin enquiries.
Browser submission returned reference `d88c7fa2-08cf-416a-ba9b-15c4045bb548`. A remote query confirmed persistence.
Only this synthetic verification enquiry was moved to recoverable trash and marked spam.
The live browser showed no captured warning/error logs or horizontal overflow at its default desktop width.
The screenshot is under root dist at `dist/apps/sites/cloudflare/logicx-live.png`.

Local checks passed: three D1 adapter tests, five existing runtime tests, Sites API/Web/Clients typechecks and lint, API/Web builds, production client release preparation, module boundaries, and component documentation checks/tests.
CMS tests passed 13 cases. The optional MariaDB integration case was skipped.
The root dependency-layout check still reports the unrelated pre-existing `apps/tconnect/web/dist` directory.
Worker types were generated under root dist. Wrangler dry run and both live deployments succeeded.

Limits: manual operator deployment only. Studio publication does not automatically redeploy this Worker.
Studio's attached SQLite inbox does not read remote D1 enquiries. No public administration endpoint or email delivery was added.
Use authorized Wrangler D1 access until a permission-aware remote inbox adapter is implemented.
Future automated hosting must use queued, auditable deployment jobs and preserve these site identity checks.

### 2026-10-17 — Ramu Tex full portfolio and mobile checks

- Replaced the green palette with ivory, ink blue, and copper. Updated logos, icons, sharing image, and the branding generator.
- Added a shared Ramu Tex header and footer across all six public pages.
- Added dedicated About, Services, Journal, Privacy, article, and unavailable-page layouts. Kept published content and contact behavior.
- Added two original generated navy/copper material studies. The images are illustrative and do not represent a documented factory.
- Fixed Services finishing enquiries to open Contact with the selected requirement.
- Improved phone typography, menu targets, form fields, process tables, image crops, and footer spacing.
- Verified all six pages at 320, 390, 430, 768, and 1440 pixels. Phone checks used device emulation.
- Verified one main heading, main region, header, and footer per page, loaded images, and no horizontal overflow.
- Verified all six mobile menus, Escape closure, focus restoration, and same-page anchor targets.
- Verified finishing expansion, requirement prefilling, and required-field validation.
- A synthetic mobile enquiry returned a reference and persisted in an isolated temporary SQLite database. Real enquiry stores were unchanged.
- Verified the production build on all six routes at 390 and 1440 pixels. No development controls, broken images, or captured warnings/errors appeared.
- Client, API, and Web type checks passed. Client lint, the Ramu Tex production build, module boundaries, and component documentation checks/tests passed.
- Fixed the Ramu Tex build command to load the existing TypeScript runtime.
- Root dependency checks remain blocked by the existing apps/tconnect/web/dist folder.
- No database migration, live CMS write, external deployment, or DNS change was required or performed.
- Published article rendering is implemented, but no live published Ramu Tex article was available for browser verification.
Final presentation checks: reduced-motion emulation disabled image transitions. Saved mobile and desktop screenshots of the production client build. Restored the working preview to desktop size.
The local Studio content API on 7010 was unavailable during these checks. Preview content used the existing brochure fallback. Live CMS delivery and published article verification remain unverified.

2026-10-17: Completed a Sites public-delivery performance audit and fixes. Cold mobile lab medians improved FCP 7.404s to 1.880s and LCP 7.420s to 2.060s; subresource transfer fell 74 percent to 345772 bytes, CLS remained zero. Replaced the app-wide UI stylesheet, reduced font payloads, deferred animation features, kept SSR content visible, added responsive hero media, removed duplicate bootstrap fetch, and added gzip/static caching. Client checks, five runtime unit tests, explicit packaged HTTP checks for LogicX/Ramu Tex and browser contact/no-JS/mobile checks passed. Detailed scope, method and remaining blockers are recorded in PLAN.md. Root dependency check remains blocked by pre-existing apps/tconnect/web/dist. No external deployment performed.

2026-10-17: Ramu Tex now uses the same shared icon-only WhatsApp enquiry button as LogicX. Removed its navy override. Verified the green 58px button, WhatsApp glyph, client-specific destination, and new-tab behavior on all six pages at phone and desktop widths. Client typecheck, lint, and production build passed. No message was sent.

## Ramu Tex deployment and LogicX refresh - 17-10-2026

- Ramu Tex: https://ramutex.codexsun.com, export sequence 19, six routes.
- Worker version: `0da3fe88-6172-48a9-9854-70f3ffdb864f`.
- Dedicated D1: `1e5f1379-1433-490d-9317-dd8d3d308200`.
- LogicX: https://logicx.codexsun.com, export sequence 18, 39 routes.
- Updated LogicX Worker version: `9cb42e7f-72ba-4d75-828f-ccae48e0d789`.
- Both releases were rebuilt from current local source. The prior LogicX cloud artifact was preserved under root dist.
- Added explicit site entry points and one shared Worker transport. Each client retains its own host, publication, and D1 identity checks.
- Both Wrangler dry runs and deployments passed. Ramu Tex DNS resolves and HTTPS works.
- Live verification passed all 45 routes, 25 homepage assets, canonical metadata, sitemap, robots, health, 404, and rejected cross-origin/invalid enquiries.
- A Ramu Tex browser enquiry returned `85d55516-7225-4f5e-99fa-056a8ba1edc4`. Remote D1 confirmed storage, and LogicX contained zero records with that reference.
- Only that synthetic enquiry was marked spam and moved to recoverable trash.
- Both sites rendered in Chrome with no captured browser errors. Screenshots are under `dist/apps/sites/cloudflare`.
- Sites API/Web/Clients typechecks and lint, module boundaries, two Worker transport tests, three D1 tests, and component documentation checks/tests passed.
- Dependency-layout validation still reports the pre-existing `apps/tconnect/web/dist` directory.
- Ramu Tex Studio domain metadata could not be updated: local API port 7010 stopped responding after export, and the web proxy returned 502.
- The Cloudflare custom domain and site are live. Remote inbox integration and automatic Studio-to-Worker deployment remain planned.
