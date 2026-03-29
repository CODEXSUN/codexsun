# Planning

## Current Batch

### Reference

`#7`

### Goal

Rewrite `Plan-7` for the real repo model and deliver a shared desk shell, clean shared UI package scope, and module-grouped framework routes that stay SaaS-first and MVP-focused.

### Scope

- `apps/framework`
- `apps/ui`
- `apps/docs`
- `ASSIST/Execution`
- `ASSIST/Documentation`
- `ASSIST/Planning`

### Canonical Decisions

- `Plan-7` must match the live `apps/framework` and `apps/ui` boundaries instead of old `apps/custom/*` references.
- `apps/ui` is the only shared design-system package other apps may consume.
- framework should consume shared desk and dashboard presentation from `@codexsun/ui`, while route ownership stays inside `apps/framework`.
- the shared UI package build and typecheck scope must exclude internal demo, docs, and Next-specific files from the public dependency graph.
- shared Vite plugin and path-resolution logic may be centralized at the root, but each app should keep its own thin local Vite config for app-specific output and mode settings.
- root lint, format, and shared TypeScript presets should stay centralized, while package-local overrides stay minimal and purpose-specific.
- each app should keep one `tsconfig.json`, and emit differences should be handled in package scripts unless a second config is technically unavoidable.
- imported or generated Next.js demo/reference material must stay outside the shared package boundary unless the repo explicitly adds a real Next.js app.
- the shared UI package should expose responsive public, auth, and workspace shells so future business apps can reuse the same layout primitives.
- route files must be grouped by module so navigation, headers, and future permissions can scale safely.
- the current framework desk must stay honest about being an MVP SaaS-first shell, not a fake finished ERP.
- login and protected dashboard flow may be frontend-only for now, but it must stay clearly documented as a placeholder until real framework auth exists.
- MariaDB remains the primary live database target.
- PostgreSQL support stays available for future hosted deployments.
- SQLite support remains prepared for the future desktop offline billing path.

### Assumptions

- tightening `apps/ui` to its public design-system surface is the fastest way to restore clean workspace validation.
- the current framework app shell is the correct place to start module-grouped route ownership and shared desk consumption.
- desktop and connector-heavy modes should branch from SaaS-proven contracts later rather than expanding this batch sideways.

### Execution Plan

1. Rewrite `Plan-7` and the planning index for the current repository model.
2. Move shared desk shell and dashboard presentation pieces into `apps/ui`.
3. Tighten the `apps/ui` package scope so public typecheck and build only cover stable shared-package files.
4. Remove duplicate or accidental public-scope files from `apps/ui` where appropriate.
5. Refactor `apps/framework` to consume shared desk and dashboard UI from `@codexsun/ui`.
6. Split framework routes by module and add route metadata for the shared desk shell.
7. Add a frontend-only login page and protected dashboard flow as an MVP placeholder.
8. Extract shared Vite helper logic to the root while keeping package-local Vite configs thin and app-specific.
9. Add root ESLint, Prettier, and consolidated TypeScript presets so shared tooling stays centralized.
10. Remove imported Next.js/demo residue from `apps/ui` so only the shared React/Vite package surface remains.
11. Reduce app config sprawl so each app keeps one `tsconfig.json` and root shared Vite logic stays centralized.
12. Add responsive public, auth, and workspace layout patterns plus ERP page templates.
13. Add public docs and ASSIST rules for one design system, route grouping, and MVP/SaaS-first delivery.
14. Validate package and root workspace typecheck/build/lint.

### Validation Plan

- Run `npm run typecheck`
- Run `npm run build`
- Run `npm run lint`
- Run `npm run build --workspace @codexsun/ui`
- Run `npm run build --workspace @codexsun/framework`

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run typecheck --workspace @codexsun/ui`
- [x] `npm run build --workspace @codexsun/ui`
- [x] `npm run typecheck --workspace @codexsun/framework`
- [x] `npm run build --workspace @codexsun/framework`

Validation note: the current batch removes the public UI package from the previous Next-specific typecheck failures, removes imported Next.js/demo residue from the active package surface, centralizes shared Vite logic at the root, reduces each app to one `tsconfig.json`, and adds responsive public/auth/workspace layout patterns plus ERP page templates. Root workspace typecheck/build/lint now pass again with the cleaned design-system boundary, while `format:check` still reflects older formatting debt.

### Plan Review Findings

- `Plan-1` is now aligned with the live repository model, but future app roots and host scaffolds are still not implemented.
- `Plan-2` is substantially completed for the shared-layer architecture, though framework runtime capability folders are still growing.
- `Plan-3` is mostly completed as repository workflow and governance, but there is not yet a real module package building under `build/module` and no release tag has been created yet.
- `Plan-4` now has an executable framework migration baseline that can safely host more platform-owned table groups.
- `Plan-7` is the next boundary-correct implementation area because the framework now needs a reusable desk shell, and the shared UI package needs a strict public boundary before more apps are added.

### Plan Review Checklist

- [x] `Plan-1` now matches the real `apps/` architecture
- [ ] `Plan-1` future app roots and hosts are scaffolded in code
- [x] `Plan-2` framework naming and boundary rules are reflected in the current scaffold
- [x] `Plan-2` UI workspace and first shared primitive layer exist
- [x] `Plan-3` build layout, versioning rules, and githelper workflow exist
- [ ] `Plan-3` actual plugin/module delivery has started under `build/module`
- [x] `Plan-4` has a documented database-foundation target that fits the framework boundary
- [x] `Plan-5` now targets the real framework runtime boundary
- [x] `Plan-7` now targets the real framework desk and shared UI package boundaries

### Risks And Follow-Up

- `Plan-1` is aligned, but large parts of its future app and host shape still need real implementation.
- `apps/docs` now exists as a Markdown documentation surface, but it is not yet a real docs application package.
- open-source redistribution for `apps/ui` is prepared, but the external publishing workflow has not been exercised yet.
- `Plan-4` and `Plan-5` are both larger than one batch, so this increment must stay honest about which platform tables are implemented now and which remain planned.
- Electron desktop runtime is not scaffolded yet.
- No API host exists yet, so the new HTTP layer is currently a framework contract foundation rather than a live backend server.
- `better-sqlite3` is a native dependency and should be revalidated when the desktop runtime is introduced.
