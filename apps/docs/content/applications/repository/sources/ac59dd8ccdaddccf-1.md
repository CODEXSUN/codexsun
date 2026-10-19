# Site Studio task and working rules

Repository source: `apps/sites/agent/TASK.md`

Source SHA-256 (LF line endings): `0bbe3c65732c2cc21ed46a1884c712ec0cc2a692db042953ed293666e44db66b`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# Site Studio task and working rules

## Tenkasi District Sports Club page refinement — October 19, 2026

- [x] Set Tenkasi District Sports Club as the public brand. Keep Sivakalai Gurukulam in the home page content.
- [x] Simplify the sticky header to the club title and controls. Remove the subtitle.
- [x] Restore the supplied Tenkasi District Sports Club logo in the header, footer, and gallery without changing the image bytes.
- [x] Show `9843930300` as a call link on the left of the top banner. Keep the language switch and member portal link on its right.
- [x] Link Home, About, Syllabus, Classes, Masters, Gallery, Contact, Students, and Alumni from the shared header.
- [x] Add Students and Alumni pages. Keep admission and member access in their existing flows.
- [x] Build separate HTML entry files for the new routes. Keep `/programs` as an alias for `/syllabus`.
- [x] Pass Sites client typecheck, lint, Worker tests (8/8), Sites API typecheck, module boundary check, and local build.
- [x] Inspect Home, Students, and Alumni in a local browser preview on port 7135.
- [x] Replace the home hero handbook image with a three-slide hero based on the Platform static page layout and controls; use local training and master photos.
- [x] Smooth the hero's copy and image transitions with overlapping Framer Motion crossfades, and reset the automatic timer after slide changes.
- [x] Animate the four home stats once as they enter the viewport, with reduced-motion support.
- [x] Add spacing around the home tradition heading and make its three cards full-card links to `/syllabus`.
- [x] Deploy the new build to the live Cloudflare Worker and verify Home, Syllabus, Students, Alumni, the JS asset, and sports club health return 200. Live Worker version: `50735ab2-d02c-448b-a244-7e1991916307`.
- [ ] Publish an updated Sites Studio content revision. D1 still serves publication version 1; code-owned club branding and home metadata are live.

## Tenkasi Sports public client and Cloudflare delivery — October 19, 2026

- **Scope & Ownership**: AGR-4 owns the public frontend, Cloudflare Worker proxy/delivery configuration, static prerendering, and minimal Sites CMS publication registration for **Veerathamilan Traditional Sivakalai Gurukulam / Tenkasi Sports** (`tenkasisports.com`).
- **Client & Port**: Named Sites client slug `tenkasisports`, template `portfolio-sportsclub`, pinned site UUID `c0de0006`, local port `7134`, database `codexsun_sportsclub_tenkasisports`.
- **Worker & Routing**:
  - Apex domain `tenkasisports.com` with `www.tenkasisports.com` redirected to apex via 308.
  - Wrangler config `apps/sites/clients/cloudflare/wrangler.tenkasisports.jsonc` targeted to Cloudflare zone `f7c324e9ca4cac54047f84f591cb54e4` (zone existence verified via authenticated Cloudflare API; see audit results below). Removed plaintext `CODEXSUN_SITES_TENKASISPORTS_SITE_KEY` from `vars` (fails closed with 503 if unconfigured; managed via Wrangler encrypted secret bindings).
  - Upstream fixed backend `https://codexsun.com`.
  - Live tenant health check against `${backend}/api/platform/public/portals/tenkasisports/health`; fails closed (503 `TENANT_SETUP_PENDING`) if backend is offline or corporate ID does not match `TENKASISPORTS`.
  - Canonical platform proxy routes: `/public/sportsclub/registration`, `/public/sportsclub/enquiry`, `/public/sportsclub/programs`, `/public/sportsclub/masters`, `/public/sportsclub/classes`, `/public/sportsclub/events`, `/public/sportsclub/club-profile`, and `/health`.
  - Removed fallback to legacy `/student/register` (fails closed on 404 to avoid orphan identities).
  - Same-origin enforced on POST, client cookies and tenant headers stripped, HMAC verification headers (`x-codexsun-public-client`, `x-codexsun-client-time`, `x-codexsun-client-signature`) attached on upstream forwards.
- **Frontend & Content**:
  - Authentic Tamil/English handbook content and syllabus from Veerathamilan Traditional Sivakalai Gurukulam.
  - Exact logo and book imagery preserved without fabrication of awards, fees, or medical claims.
  - Responsive public routes: Home, About, Programs (Silambam), Masters, Classes, Events, Gallery, Join (Student Registration), Contact (Public Enquiry), Privacy, Terms, and 404.
  - Forms validate strictly against Platform public schemas (`studentEnrollmentSchema`, `publicEnquirySubmissionSchema`):
    - Removed synthetic email creation, fake references, and client-side fake success.
    - Added student-selected password and confirmation (min 12 chars) for portal account creation; never displayed or persisted in UI.
    - Replaced dropped fields (`age`, `category`, `level`) with genuine schema persistence fields (`dateOfBirth`, `emergencyContact`, `guardianPhone`, `guardianName`, `medicalNotes`, `address`).
    - Contact form requires explicit opt-in privacy consent checkbox matching `publicEnquirySubmissionSchema` (`consent: true`).
    - Actionable error and retry display on network or validation failures; success receipt displayed only upon confirmed backend response.
  - Portal link configured to authenticated tenant desk: `https://app.codexsun.com/login?desk=tenant&app=sportsclub&corporateId=TENKASISPORTS`.
- **Verification Gates**:
  - `node --import tsx --test apps/sites/clients/cloudflare/tenkasisports.worker.test.ts`: 8/8 passed (including missing secret fail-closed, backend error propagation, and duplicate conflict tests).
  - `node --import tsx --test apps/platform/api/src/sportsclub-platform.test.ts`: 11/11 passed.
  - `npm run typecheck -w @codexsun/sites-clients`: 0 errors.
  - `npm run lint -w @codexsun/sites-clients`: 0 warnings, 0 errors.
  - `npm run typecheck -w @codexsun/sites-api`: 0 errors.
  - `npm run typecheck -w @codexsun/sites-web`: 0 errors.
  - `npm run build:tenkasisports -w @codexsun/sites-clients`: Built cleanly.
  - `node tools/check-module-boundaries.mjs sites`: Passed.
  - Cloudflare deployment authorized by user and completed on October 19, 2026.
- **Cloudflare Live Deployment & Audit Evidence (October 19, 2026)**:
  - **Account & Zone**: Authenticated Cloudflare API (`GET /client/v4/zones?name=tenkasisports.com`) and `wrangler whoami` confirmed zone `tenkasisports.com` exists with ID `f7c324e9ca4cac54047f84f591cb54e4` in account `a68cf61bf5bae3f83ddb7765dc29a835` (`Codexsun@gmail.com's Account`). Status is `active` on `Free Website` plan using nameservers `evan.ns.cloudflare.com` and `sara.ns.cloudflare.com`. Public DNS resolves to Cloudflare proxy Anycast IPs `172.67.164.163` and `104.21.74.238`.
  - **D1 Content Database**: Dedicated D1 database `codexsun-tenkasisports-content` created in APAC region with UUID `1fff5450-d9a8-473c-8b11-45ecad357a60`. Applied content schema (`apps/sites/clients/cloudflare/tenkasisports.content.sql`) and seeded initial authentic handbook publication (version 1, checksum `87c2a114c05b925d107eb6e834ea033ab9c7cf8652884a6815f1495aaeeb6807`). Live `GET /__sites-version` and `GET /__sites-content` return 200 with live publication payload.
  - **Worker Deployment**: Worker script `codexsun-tenkasisports` deployed via `wrangler deploy -c apps/sites/clients/cloudflare/wrangler.tenkasisports.jsonc`. Current live Version ID: `1ded24cb-a4fa-4291-a95a-a948f85755c5` (initial version: `5c98545a-ccb8-457e-a406-0b98fc62b99e`). Triggers deployed: `tenkasisports.com/*` and `www.tenkasisports.com/*`.
  - **Live Traffic & Routes Verification**:
    - Apex `https://tenkasisports.com/`: 200 OK, title `வீரத்தமிழன் பாரம்பரிய சிவகலை குருகுலம் | Tenkasi Sports`, ~7.1 KB HTML, `X-Codexsun-Publication: 1`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.
    - WWW `https://www.tenkasisports.com/*`: 308 Permanent Redirect to canonical apex `https://tenkasisports.com/*`.
    - 10 Public Page Routes (`/about`, `/programs`, `/masters`, `/classes`, `/events`, `/gallery`, `/join`, `/contact`, `/privacy`, `/terms`): All return 200 OK with distinct authentic Tamil/English titles, OpenGraph metadata, canonical links, and ~7KB prerendered HTML.
    - Nonexistent routes (`/nonexistent-route`): Return HTTP 404 Not Found with 404 title and description.
    - Static Assets (`/favicon.svg`, `/assets/index-*.js`, `/assets/index-*.css`, `/fonts/geist-latin.woff2`, `/logo.png`, `/logo.jpeg`, `/asan-portrait.jpg`, `/asan-temple-staff.jpg`, `/gallery-stance-*.jpg`): 200 OK with accurate MIME types.
  - **Backend Limitation & Fail-Closed Guard**:
    - Sportsclub backend API on `codexsun.com` (`/api/platform/public/portals/tenkasisports/health`) is still pending deployment by coordinator/AGR-3.
    - Worker health and admission endpoints (`/api/sportsclub/health`, `POST /api/sportsclub/registration`, `POST /api/sportsclub/enquiry`) fail closed with HTTP 503 `TENANT_SETUP_PENDING` (`"The Tenkasi Sports workspace is being prepared. Please check back shortly."`).
    - Cross-origin POSTs are rejected with HTTP 403 `A same-origin request is required.`
    - Forms visibly display network error messages and prevent submitting until Platform API is deployed.
    - No secrets or credentials were hardcoded in repository files. Secrets remain configured via encrypted bindings.

## Tirupur Connect content management — October 17, 2026

Verified: local authenticated draft/publication persistence and export sequence 24; six publication/Worker checks; six runtime checks; Sites CMS checks (13 passed, one opt-in MariaDB check skipped); affected TypeScript, lint, module boundaries and dependency layout. Deployed the latest public frontend as Worker version `0665e060-cb68-4195-a145-c509f7edec05`. Live content matches the approved Sites export; all 14 public routes passed at 1440, 768, 390 and 320px without runtime exceptions. The separate remote Studio/VPS release was not performed.

Open Sites → Tirupur Connect → Manage. Client details edits branding and public contacts. Pages → Textile edits hero imagery, category copy and images, directory and community headings, the sourcing guide, the closing banner, pending-state copy and public page introductions. Hero, Page & SEO, and Footer have their own sections. Individual category images use full crops. Image sheets use a 3 by 2 crop. Use deployed local image paths or public HTTPS JPG, PNG or WebP URLs. File upload is not included.

Save draft keeps edits private. Publish page creates the public version using existing permissions and revision checks. Start connects the local preview to this client's publication. Business records, credentials, account access, enquiries and conversations remain TConnect-owned and require TIRUPURCONNECT. CMS content never changes that tenant selection.

Live delivery uses an authenticated publication export, not a development API or public management endpoint. Export through the existing client publication control. Set `CODEXSUN_SITES_TIRUPURCONNECT_SNAPSHOT` to the absolute exported JSON filename. Run `npm run build:tirupurconnect -w @codexsun/sites-clients`, then `wrangler deploy --config apps/sites/clients/cloudflare/wrangler.tirupurconnect.jsonc --keep-vars`. The builder verifies checksum, slug, domain and pinned site UUID `e303865e`. It embeds only the published content and blogs, without delivery keys or private drafts. The deployed site reads that version through a read-only same-origin endpoint. Subsequent Studio publication needs another export/build/deploy; automatic remote delivery is not implemented.

No SQL column migration is required for the optional textile content field. Existing publications remain valid. Existing Tirupur Connect generic drafts need approved content initialized before export. The local CMS integration check verifies draft isolation, publish, stale saves, unsafe-image rejection and export. Unit checks cover deployment identity and safe embedding. VPS configuration and a remote Studio registry remain separate.

## Tirupur Connect client move — October 17, 2026

- Moved all TConnect public pages, public components, styles, imagery, metadata builder, and Worker into Sites clients.
- Added the named template, catalogue entry, seed identity, build mode, and verified local Studio client registration.
- Studio Start opened the client on port 7040 and returned the matching client identity.
- Kept private TConnect workspaces and public business schemas/services in their owning app through a public package export.
- Preserved the live hostname and Worker. Published the Sites-built frontend through the existing Cloudflare zone routes.
- Reduced the production JavaScript artifact from about 642 kB to 387 kB and replaced external font imports with a self-hosted font.
- Added a coherent sourcing-guide view and single directory setup state while the dedicated backend tenant is unavailable.
- Worker tenant guard tests, boundaries and boundary regression tests, Sites/TConnect/Platform type checks, Sites lint, and production build passed.
- Sites CMS tests passed 13 checks with one opt-in MariaDB test skipped. Five runtime checks passed.
- The backend still reports CODEXSUN. TIRUPURCONNECT data and full account workflows remain pending the separate VPS setup.
- No VPS configuration changed in this client move. Remote Studio registry creation was not performed.

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
- Sites type checks and lint, Sites module boun
```
