# Task

## Active Batch

### Reference

`#7`

### Title

`Shared desk shell, UI scope cleanup, and module routing`

### Scope Checklist

- [x] Rewrite `Plan-7` for the real `apps/framework` and `apps/ui` workspace model
- [x] Move shared desk shell and dashboard presentation pieces into `apps/ui`
- [x] Tighten `apps/ui` public package scope so demo and Next-specific files are out of the shared design-system build path
- [x] Split framework desk routes by module under `apps/framework/src/app/modules/platform`
- [x] Add a frontend-only login page, protected dashboard routes, and local-session placeholder flow
- [x] Extract shared Vite helper logic to the root and keep per-app Vite configs thin
- [x] Add root ESLint and Prettier config and reduce redundant package TypeScript config
- [x] Remove imported Next.js/demo residue from `apps/ui` and keep only the shared React/Vite design-system surface
- [x] Reduce app config sprawl so each app keeps one `tsconfig.json` and shared Vite logic stays at the root
- [x] Add responsive public, auth, and multi-role workspace layout patterns plus ERP list/master/entry page templates
- [x] Update rules and public docs for one shared design system, module-grouped routes, and SaaS-first MVP delivery

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run typecheck --workspace @codexsun/framework`
- [x] `npm run build --workspace @codexsun/framework`
- [x] `npm run typecheck --workspace @codexsun/ui`
- [x] `npm run build --workspace @codexsun/ui`

Validation note: the shared UI package now validates as a public design system, framework consumes the shared desk shell cleanly, imported Next.js/demo residue has been removed from the active package surface, each app now builds from a single `tsconfig.json`, and full root workspace typecheck/build/lint pass again. `npm run format:check` still reflects a broader formatting backlog that was not mass-rewritten in this batch.

## Plan Review

### Plan-1 Status

- [x] `Plan-1` is rewritten for the real `apps/` architecture
- [x] The implemented roots `framework`, `ui`, `cli`, and `docs` are documented
- [x] Framework, UI, CLI, and docs assembly rules are documented
- [x] Database and migration grouping rules are documented in `Plan-1`
- [ ] Future app roots such as `core`, `billing`, and `ecommerce` are scaffolded
- [ ] Backend and desktop hosts are scaffolded

Status note: `Plan-1` now matches the real repository model; the remaining gaps are implementation gaps, not planning mismatch.

### Plan-2 Status

- [x] Naming and boundary rules for `framework` and `ui` are documented
- [x] `apps/framework` exists with capability-first folders such as `auth`, `runtime`, and `connectors`
- [x] Framework code remains separate from app-specific business workflows in the current scaffold
- [x] `apps/ui` is scaffolded
- [x] Shared primitives exist under `apps/ui/src/components/ui`
- [ ] The full recommended framework substructure exists for `http`, `media`, `notifications`, `payments`, `web/auth`, `web/shells`, and `web/support`

Status note: `Plan-2` is now substantially completed for the current shared-layer architecture, but several recommended framework capability folders are still not scaffolded.

### Plan-3 Status

- [x] Shared build roots exist at `build/app` and `build/module`
- [x] Standalone app builds already land under `build/app/framework/web` and `build/app/cli`
- [x] `githelper` exists for `check`, `version:bump`, `commit`, and `release`
- [x] Lockstep versioning is set to `0.0.1` with `v-0.0.1` release tag format
- [x] Reference-first execution and changelog discipline is documented
- [ ] A real plugin or module package such as `apps/frappe` is scaffolded and built under `build/module/<module>`
- [ ] A release tag has been created through `githelper release`

Status note: `Plan-3` is mostly completed for repository governance, but module delivery and tagged release flow have not started yet.

### Plan-4 Status

- [x] The platform foundation database direction is documented in `Plan-4`
- [x] The first detailed foundation table contracts exist in framework runtime code
- [x] Ordered migration-plan metadata exists for the implemented foundation layers
- [x] Executable migration commands and SQLite smoke testing now exist
- [x] Public framework docs describe the database foundation structure and ownership
- [ ] Remaining recommended foundation tables are scaffolded

Status note: the first `Plan-4` implementation is now executable, but the full platform-foundation table set and future backend hosts still remain.

### Plan-5 Status

- [x] `Plan-5` now matches the real `apps/framework` runtime boundary
- [x] Framework HTTP namespace and contract ownership is defined under runtime code
- [x] Framework integration tables are split into ordered schema and migration files
- [x] Public docs exist for the framework API boundary and integration foundation
- [ ] A real backend host mounts the internal, external, and public assemblies
- [ ] Secret issuance, hashing, revocation, and live auth flows are implemented

Status note: `Plan-5` now has a real implementation foundation, but the live server host and auth execution flow remain future work.

## Next Batch

### Reference

`#8`

### Title

`Backend host, company control modules, and desktop runtime scaffolds`

### Scope Checklist

- [ ] Add a backend composition root under the framework boundary and mount the framework API assemblies
- [ ] Start the company-centric control foundation from `Plan-6`
- [ ] Scaffold the first real plugin/module package such as `apps/frappe`
- [ ] Start the desktop runtime path for offline SQLite-backed billing flows
- [ ] Decide whether `apps/docs` should become a real docs app package instead of a Markdown-only surface
