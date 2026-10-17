# Site Studio task and working rules

Repository source: `apps/sites/agent/TASK.md`

Source SHA-256 (LF line endings): `e7806663b1c4dad212fa4e293f4eff39d8b02a7a73a894640eadbb79e06e398e`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
 publication sequence 13. Client/Web/API typechecks and lint passed; CMS tests 13 passed, optional MariaDB integration test skipped. Packaged desktop/mobile screenshots, three loaded backdrop assets, responsive layout, enquiry links and reduced-motion checks passed. No external deployment performed.


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
```
