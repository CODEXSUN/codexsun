# Site Studio task and working rules

Repository source: `apps/sites/agent/TASK.md`

Source SHA-256 (LF line endings): `50c2c4f22321c3d300050fbb929ed1fae80fe4d35bf99b0d91b4eb2e74ba0b17`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
rors. Screenshots are under `dist/apps/sites/cloudflare`.
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
