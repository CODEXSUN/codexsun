# UI Gallery Application Ownership

Date: 2026-09-10

## Outcome

`packages/ui` remains the single source owner for reusable CODEXSUN UI. The UI Gallery is
application code and now belongs to `apps/uiux/web/src/modules/gallery`.

## Ownership and bindings

- `apps/uiux/web/src/modules/gallery` owns gallery pages, catalogs, previews, specimens,
  examples, code samples, routes, navigation, environment, and browser state.
- `packages/ui` does not export a UI Gallery entry point.
- `packages/ui` is the only source owner for reusable primitives, components, form frames,
  field controls, blocks, layouts, templates, visual variants, hooks, tokens, and theme assets.
- Each application uses public `@codexsun/ui` exports and must not create a reusable UI copy.
- Applications own business data, fields, validation, routes, permissions, callbacks,
  workflows, and screen composition. They pass these values to package-owned UI.
- `apps/uiux/web/src/app.tsx` imports the Gallery module locally and supplies application identity.
- `tools/check-ui-design-system.mjs` requires the app gallery and rejects a package gallery folder.
- The checker rejects raw app-local buttons, selects, tables, and text areas.
- Docs, Identity, and Zetro now use public shared Table primitives.
- Identity role fields now use the public shared Input primitive.
- Business data, routes, permissions, persistence, and workflows remain application-owned.

## Guidance map

The ownership rule now appears in `AGENTS.md`, the root README, UI skills, the UI application
READMEs, the UI module catalog, and the package owner README. These documents separate the
application-owned gallery from package-owned reusable UI.

## Parallel work boundary

Concurrent Docs, Orship, Identity, Zetro, and workspace-card changes were preserved.

## Verification

- `npm.cmd run check:ui-system` passed with no raw app Button, Select, Table, or Textarea controls.
- `npm.cmd run typecheck` passed for all 27 workspaces.
- `npm.cmd run build` passed for all 27 workspaces, including the Zetro Tauri executable.
- `npm.cmd run lint` passed for all workspaces and root tools.
- Application docs, module docs, module boundaries, module dependencies, workspace layout,
  versions, authored line limits, build output, and `git diff --check` passed.
- The UI production entry chunk is 386.81 KB and remains below the 400 KB budget.
- Browser verification passed for Overview and Agent Workspace at `http://127.0.0.1:6130`, with
  no console warning or error.
- `npm.cmd run format:check` passed after formatting the three concurrently changed files reported
  by Prettier; their behavior and ownership remained unchanged.
