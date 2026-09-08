# Web UI Skill

Use this guide for work in `apps/platform/web` and future product web apps.

## Responsibilities

- Keep React views, client routing, client state, and browser interactions in the owning web application.
- Put reusable web UI primitives, application layouts, composition-ready templates, hooks, and theme assets in `packages/ui`.
- Use `@codexsun/ui/layouts/mdi-main` as the base frame for CODEXSUN web applications. Keep each application's workspace content in its owning app.
- Supply application identity, navigation contributions, search copy, and user actions through the MDI layout contract. Do not recreate top menus, app switchers, profile popovers, feature settings, or status bars inside applications.
- Put colors, spacing, typography, and other visual values in `packages/ui/src/tokens`.
- Use Tailwind CSS and shadcn/ui conventions. Configure each app `components.json` to install reusable items in `packages/ui`; keep application composition in the app.
- Use `@codexsun/ui/templates/ui-page` for UI component and block documentation.
  Read [ui-template-pages.md](ui-template-pages.md) before changing those pages.
- Use TanStack Query for server-state caching and TanStack Router for application routes.
- Register module routes and navigation through `@codexsun/platform-core-web` contributions.
- Use Zod to validate untrusted client data. Share API shapes through an owning public contracts package.

## Quality rules

- Preserve accessible semantics, keyboard operation, focus handling, and clear loading, empty, and error states.
- Use the shared default Button height of 40px for standard actions. Choose a smaller
  named size only for explicitly compact toolbars, icon controls, or dense tables.
- Every enabled button, pagination action, select control, and actionable dropdown item must display a pointer cursor.
  Enforce this through shared UI primitives and the base theme instead of repeating
  application-local styles. Disabled controls remain non-interactive.
- Use Framer Motion only when motion clarifies feedback or state change.
- Use DnD Kit only when drag-and-drop is essential and has a keyboard path.
- Keep API URLs and environment configuration explicit; do not silently fall back to production services.

## Verify

Run `npm.cmd run typecheck` and `npm.cmd run build`. Confirm changed UI in a browser when a dev server is available.

## Development record

After each web feature, update its module README and the application development record. Record routes, navigation, query keys, API contracts, runtime settings, UI states, browser checks, and parallel layout work.

Update this guide when a tested browser pattern replaces an earlier web workflow.
