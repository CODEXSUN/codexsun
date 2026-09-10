# Independent UI Application

Date: 2026-09-09

## Outcome

The UIUX gallery is now an independent application at `apps/uiux/web`. Platform no longer owns the
`/ui` route. Local development runs UI on port `6130`, and deployment profiles select it as a
separate static component.

## Ownership decision

- `packages/ui` remains the single owner of reusable components, blocks, application layouts,
  generic templates, hooks, design-system contracts, tokens, and the Tailwind theme.
- `apps/uiux/web` owns the runnable browser shell, gallery catalogs, documentation pages,
  live specimens, examples, code samples, routes, navigation, environment, and browser state.
- `packages/ui` owns reusable components, blocks, layouts, templates, hooks, tokens,
  theme assets, and design-system contracts.
- The gallery uses public package exports. It cannot import package-private source or
  recreate shared UI implementations.

## Runtime binding

- Root command: `npm.cmd run dev:uiux`.
- Component: `uiux-web`.
- Default address: `http://127.0.0.1:6130`.
- Production output: `dist/apps/uiux/web`.
- Main and complete development profiles include the UI application.
- Orship discovers UI through the deployment catalog and shows it as its own application row.

## Verification

- Focused type-check, lint, build, UI boundary, documentation, workspace, and runtime checks passed.
- The largest production JavaScript chunk is 386.57 KB, below the 400 KB warning budget.
- The version-bump regression test and root version-consistency check passed for `0.1.15`.
- Local preflight start, browser navigation, title, and process shutdown checks.

## Release

- Root release: `0.1.15`.
- Database changes: none.
- Canonical release entry: `assist/documentation/CHANGELOG.md`.

The ownership correction completed on 2026-09-10 is recorded in
`assist/records/ui/2026-09-10-ui-gallery-application-ownership.md`.
