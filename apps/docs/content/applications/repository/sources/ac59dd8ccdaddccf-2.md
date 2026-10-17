# Site Studio task and working rules

Repository source: `apps/sites/agent/TASK.md`

Source SHA-256 (LF line endings): `caadb4b6d0a7db78520425f1ab5f284fa7345348eba3c0cad7c1d0a8f7082841`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
s. Unmapped technology names display text only. Typecheck, lint, deployment build and packaged browser checks passed for all six loaded logos and mobile overflow.


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

### 2026-10-17 — Hosiery and polyester sports fabric guide

- Added two fabric stories on Home and a detailed guide on Services.
- Covered single jersey, rib, interlock, piqué, French terry, fleece, polyester sports jersey, mesh, stretch blends, and jacquard sports knits.
- Added garment application imagery, sample-brief details, four quality checkpoints, four FAQs, and textile reference links.
- Added a Contact briefing panel and ten fabric-specific enquiry links. Existing public enquiry submission behavior is unchanged.
- Added accessible native detail panels and reduced-motion support.
- Fixed direct fragment links after the client mounts, including /services#hosiery and /services#sports-fabrics.
- Generated four original images with the built-in image tool. Stored local WebP variants at 1200px and 640px.
- New 1200px image files total 644720 bytes. The four 640px files total 172934 bytes.
- Fabric descriptions are educational template content. Existing published company facts remain unchanged. No migration or CMS write was required.
- Checked Home, Services, and Contact at 320, 390, 430, 768, and 1440px. No horizontal overflow or wide fabric panels appeared.
- Verified ten detail panels, four FAQs, keyboard enquiry navigation, fabric prefilling, direct section links, and four loaded mobile images.
- Verified all six production routes at 390 and 1440px. No development controls or captured warning/error logs appeared.
- Reduced-motion emulation produced zero-duration image transitions.
- Clients, API, and Web typechecks passed. Client lint and the Ramu Tex production build passed.
- Sites module boundaries, root dependency layout, and component documentation checks/tests passed.
- Saved local desktop and mobile screenshots. This content update was not deployed externally.

## Live fabric release and mobile verification - 17-10-2026

- Deployed Ramu Tex to https://ramutex.codexsun.com from current source and authenticated publication export sequence 21.
- Active Worker version: `477f103f-db36-4110-9e58-373ff6fb77d4`.
- Included the hosiery and polyester sports fabric guide, ten construction panels, four FAQs, garment applications, contact briefing, and ten fabric enquiry links.
- Uploaded all four new original fabric images in full-size and 640px WebP versions. All eight live URLs returned 200 image/webp.
- Verified all six live routes, ten homepage assets, sitemap, robots, canonical URLs, health, 404, and invalid/cross-origin enquiry rejection.
- Checked all six live pages at 320, 390, and 430px browser viewport widths. Each had one main heading and one main region, no horizontal overflow, and no broken visible images.
- At 390px, all four new fabric images loaded their 640px variants. Verified mobile menu open/Escape closure and expandable fabric details.
- A Single jersey enquiry link opened Contact with the correct prefilled requirement.
- A mobile form submission returned reference `5374d2a0-c2ec-4f5d-841b-d6e4c78dbf95`. Remote D1 confirmed persistence. Only this synthetic record was marked spam and moved to recoverable trash.
- No browser warning/error logs were captured. Saved mobile evidence at `dist/apps/sites/cloudflare/ramutex-fabrics-live-mobile.png` and reset the browser viewport.
- These were desktop Chrome viewport checks, not a physical mobile-device test.
- Client typecheck, lint, production packaging, module boundaries, and component documentation checks/tests passed.
- Root dependency layout remains blocked by the existing `apps/tconnect/web/dist` directory.
- The Studio API is available again. Its Ramu Tex domain was updated successfully to `ramutex.codexsun.com`, resolving the prior metadata blocker.
```
