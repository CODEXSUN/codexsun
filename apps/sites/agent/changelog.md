# Sites Studio Changelog

This log records repository changes for the Sites Studio multi-site portal.

## 2026-09-25 — Multi-site portal and control plane foundation

### Added

- Client portal compositions for Codexsun, DevXcrew, Logicx, and Skilloopz.
- SQLite-backed client content, drafts, publishing, unpublishing, and revision records.
- Sites Studio runtime monitoring and standalone client runtime controls.
- Shared workspace status blocks in `@codexsun/ui`.
- Client route manifests, SEO discovery files, accessibility states, and route tests.
- Lazy client page chunks and shared UI/vendor bundle boundaries.
- Phase plan and verification records under `apps/sites/agent/`.

### Verification

- Sites API tests passed with one environment-dependent MariaDB test skipped.
- Sites web route and discovery tests passed.
- Shared UI tests passed.
- Sites API and web typechecks, lint, and production builds passed.

### Repository hygiene

- Added ignore rules for generated `build/`, `.agents/`, `.cache/`, and `finalse/` directories.
- Existing unrelated worktree changes were kept out of this Sites commit.

### Release state

- Local commits: complete on `main`.
- Remote push: complete to `origin/main`.
- Main branch merge: no separate branch; local branch is already `main`.
