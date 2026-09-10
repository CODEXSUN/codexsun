# UIUX Application Rename

## Outcome

The design-system showcase application moved from `apps/ui` to `apps/uiux`. The new name separates
the user-experience application from the shared `packages/ui` library.

## Runtime bindings

- Application ID: `uiux`
- Web component ID: `uiux-web`
- Workspace: `@codexsun/uiux-web`
- Root command: `npm.cmd run dev:uiux`
- Environment keys: `UIUX_WEB_HOST` and `UIUX_WEB_PORT`
- Production output: `dist/apps/uiux/web`

## Ownership

- `apps/uiux` owns the runnable gallery, examples, routes, navigation, and browser state.
- `packages/ui` owns reusable components, blocks, layouts, templates, tokens, and themes.
- Applications import shared UI only through public `@codexsun/ui` exports.
- Applications must not import UIUX source or depend on `@codexsun/uiux-web`.

## Verification

- Run the workspace, catalog, application documentation, module documentation, and UI-system checks.
- Type-check, lint, and build `@codexsun/uiux-web`.
- Start `npm.cmd run dev:uiux` and verify the UIUX title and gallery navigation.
