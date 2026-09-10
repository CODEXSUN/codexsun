# Shared UI and Application Ownership Idea

Date: 2026-09-09

## Outcome

The Ideas page formerly named Multi-app monorepo is now Shared packages and
application ownership. It explains the repository model with named package and
application cards.

## Content

- Framework, Platform Core, UI, and Runtime have separate descriptions and colored icons.
- Platform, UI, Docs, DevKit, Zetro, and Orship each show their owned product area.
- The UI application card identifies the independent showcase website and visual verification
  surface.
- UIUX owns its gallery pages, examples, routes, and browser state. The gallery consumes
  reusable components and blocks through public `@codexsun/ui` exports.
- The UI section explains its tokens, primitives, blocks, templates, and MDI layout.
- A clear ownership comparison separates reusable UI from application product behavior.
- The reusable map cards use `WorkspaceActionCard` from `@codexsun/ui`.
- `WorkspaceActionCard` accepts an optional icon class so consuming applications can use semantic
  icon tones without rebuilding the card.
- The map now shows only package and application titles.
- The map cards use one centered icon-over-title treatment. Orship stays in the same responsive application row as Platform, UIUX, Docs, DevKit, and Zetro.
- A two-step chart separates the repository build path from the live domain request path.

## Verification

- Docs web and UI type checks cover the package export and consuming Ideas page.

## Runtime startup

- The shared preflight process now keeps an IPC channel when it is launched by a
  development stack. It can therefore confirm that the child service spawned
  before the stack begins its health probe.
- This fixes the false `Docs API preflight did not start the service` failure;
  port reservation and the Docs API startup remain separate checks.
