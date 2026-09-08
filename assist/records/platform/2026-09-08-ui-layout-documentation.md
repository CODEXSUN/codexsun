# UI Layout Documentation Workspace

## Outcome

Platform `/ui` now provides a design-system Overview and documentation pages
for each shared layout. Each page includes a preview, usage rules, ownership
guidance, and code that the user can copy.

## Authoritative references

- Owner README: `apps/platform/web/src/modules/ui-gallery/README.md`
- Application catalog: `assist/modules/platform.md`
- Shared UI owner: `packages/ui/README.md`
- Local skill: `assist/skills/web-ui.md`

## Ownership and boundaries

`packages/ui` owns the layout registry, documentation composition, previews,
code examples, and Overview cards. Platform maps the registry into its MDI
sidebar. Applications still own their routes, data, actions, and workflows.

## Binding properties

| Producer        | Consumer         | Binding                   | Version or key                                 |
| --------------- | ---------------- | ------------------------- | ---------------------------------------------- |
| Layout registry | Platform sidebar | Layout navigation         | `uiLayoutDocs`                                 |
| Platform router | UI workspace     | Selected layout           | `/ui?layout=<layout-id>`                       |
| Platform shell  | App launcher     | UI desk                   | `UI` -> `/ui`                                  |
| Layout registry | Documentation    | Preview and code          | `UiLayoutDoc`                                  |
| MDI preview     | Documentation    | Interactive live sections | `command`, `navigation`, `workspace`, `status` |
| Code panel      | Browser          | Copy example              | `navigator.clipboard.writeText`                |
| UI workspace    | ITO              | Page and content regions  | `20`, `21.*`, `22.*`, `23.*`, and `24.*`       |

## Parallel work

The worktree contains concurrent Docs, DevKit, Zetro, runtime, topology, and
shared table changes. This work does not change those modules or their data.

## Decisions

- Put Layouts first in the UI workspace sidebar.
- Keep Overview in the existing primary-action position.
- Register the UI desk in the application launcher and show its active state on `/ui`.
- Use one registry for sidebar labels, package paths, descriptions, and code.
- Build original previews from shared tokens instead of copying reference pages.
- Replace the image-like MDI mockup with separately selectable live sections and real controls.
- Use Tailwind utilities for all page and preview styling.
- Keep the existing MDI appearance panel as the design tweak control.
- Add Components after Layouts and render package-owned components directly instead
  of using preview images.
- Use the centralized table block with exactly ten realistic sample rows on its docs page.
- Group Table and Form under Blocks and list all package primitives under Components.
- Reuse `UiTemplatePage` for every block and component route.
- Keep form values, lookup data, validation, and persistence outside the shared Form block.

## Verification

- Passed focused shared UI and Platform web type checks and production builds.
- Verified Overview and all four layout pages in the browser.
- Verified MDI section selection and the interactive Summary and Activity workspace states.
- Verified the launcher exposes Platform and UI as links and marks UI as active on `/ui`.
- Verified active sidebar states, page links, previews, and Copied feedback.
- Verified the Overview in light and system modes.
- Passed the complete root `check` gate and all 20 automated tests.
- Passed the complete root check after the live preview change.
- Passed the 400 KB production chunk budget for 127 chunks.
- Passed `git diff --check`.
- Verified the Table sidebar route renders ten live rows with search and column controls.
- Passed the complete root check after adding the live Table documentation page;
  the production chunk budget passed for 133 chunks.
- Passed the shared UI type check after adding the Form block and catalog-driven
  component documentation routes.
- Passed the Platform production build, lint, application and module documentation checks,
  authored-file line check, and `git diff --check`.
- Verified `/ui?block=form` in the browser, including the live searchable lookup option list,
  active switch, icon actions, Blocks navigation, and previous/next links.
- Verified `/ui?component=accordion` renders through the shared template with live controls,
  its public import path, copyable code, and named navigation.
