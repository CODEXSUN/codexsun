# Planning

## Active Batch

- `#125` Verify and unblock company upsert logo upload flow
  - Scope: refactor the company branding publish path so the repository root `public/` folder is the canonical live public branding source, publish overwrites only `public/logo.svg`, `public/logo-dark.svg`, and `public/favicon.svg` after backup into `storage/backups/branding`, and storefront runtime resolves those same root-public files directly.
  - Assumption: the intended platform behavior is that Vite and build output both derive public assets from the repository root `public/` folder, so company branding publish must target that shared source rather than an app-build-specific public folder or backend-only managed endpoint.
  - Phase 1: refactor the batch plan to the root `public/` branding model and confirm tracked scope. Completed.
  - Phase 2: make root `public/` the canonical live brand asset source with backup before overwrite. Completed by changing brand publish reads and writes so generated brand files are stored under `storage/branding/active`, old public files are backed up under `storage/backups/branding`, and live published files are copied into the repository root `public/` folder.
  - Phase 3: align storefront logo and favicon reads to `public/logo.svg`, `public/logo-dark.svg`, and `public/favicon.svg`. Completed by restoring managed brand URLs to those root-public file paths with version query strings, updating the framework static host to prefer repository-root `public/` files before built assets for direct public requests, and explicitly pinning the app sidebar to the light logo plus a light-mode logo badge treatment.
  - Phase 4: run focused validation and update planning or changelog with the final outcome. Completed with `npx.cmd tsx --test tests/cxapp/company-brand-assets-service.test.ts`, `npx.cmd playwright test tests/e2e/storefront-brand-publish.spec.ts`, `npx.cmd playwright test tests/e2e/company-logo-upload.spec.ts`, and `npm.cmd run typecheck`.
