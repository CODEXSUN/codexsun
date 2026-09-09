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

| Producer        | Consumer         | Binding                  | Version or key                           |
| --------------- | ---------------- | ------------------------ | ---------------------------------------- |
| Layout registry | Platform sidebar | Layout navigation        | `uiLayoutDocs`                           |
| Platform router | UI workspace     | Selected layout          | `/ui?layout=<layout-id>`                 |
| Platform shell  | App launcher     | UI desk                  | `UI` -> `/ui`                            |
| Layout registry | Documentation    | Preview and code         | `UiLayoutDoc`                            |
| MDI preview     | Documentation    | Embedded shared shell    | `MdiMain`                                |
| Code panel      | Browser          | Copy example             | `navigator.clipboard.writeText`          |
| UI workspace    | ITO              | Page and content regions | `20`, `21.*`, `22.*`, `23.*`, and `24.*` |

## Parallel work

The worktree contains concurrent Docs, DevKit, Zetro, runtime, topology, and
shared table changes. This work does not change those modules or their data.

## Decisions

- Put Layouts first in the UI workspace sidebar.
- Keep Overview in the existing primary-action position.
- Register the UI desk in the application launcher and show its active state on `/ui`.
- Use one registry for sidebar labels, package paths, descriptions, and code.
- Build original previews from shared tokens instead of copying reference pages.
- Render the package-owned MDI shell as one live composition inside the layout page.
- Use Tailwind utilities for all page and preview styling.
- Keep the existing MDI appearance panel as the design tweak control.
- Add Components after Layouts and render package-owned components directly instead
  of using preview images.
- Use the centralized table block with exactly ten realistic sample rows on its docs page.
- Group Table and Form under Blocks and list all package primitives under Components.
- Reuse `UiTemplatePage` for every block and component route.
- Use `CODEXSUN UI` as the UI workspace browser title.
- Keep 48px between the shared documentation tool strip and live content.
- Show UI navigation groups as compact collapsed headers at initial load. Put child
  links on an indented vertical rail when the user opens a group.
- Use related icons for Layouts, Blocks, and Components. Animate each rail with the
  shared 300ms easing and reduced-motion fallback.
- Keep form values, lookup data, validation, and persistence outside the shared Form block.
- Keep Back, title, Cancel, and Save in the Form block top toolbar. Place tabs directly below
  it and omit a repeated action footer.
- Render the Form toolbar and body as separate surfaces with a small gap between them.
- Use a package-owned registry for component examples and their default selection.
- Use `UiComponentDisplayPage` as the central component documentation composition. Let
  each route pass only its selected component catalog record.
- Keep the shared Button primitive compatible with shadcn composition. Add semantic
  variants through shared tokens and keep the standard action height at 40px.
- Render a dedicated live specimen for each component route. Do not repeat a complete
  category gallery on every component page.
- Expose only variants implemented by each component. Show one green Default badge when
  a component has one composition. Keep block pages bound to defaults only.
- Preserve the UI sidebar's expanded groups and scroll position in session storage so
  component navigation and browser refreshes do not reset the reader's place.
- Keep MDI Main as the only Layout documentation entry. Render it through the same
  header, 90-percent preview, usage and code, and navigation structure as Table.

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
- Verified the compact Form toolbar in the browser. Back and title align left, actions align
  right, and the tabs start directly below the toolbar without a lower action footer.
- Verified that UI navigation groups load collapsed. Opening Components shows aligned child
  links on the indented vertical rail.
- Verified the related section icons and the 300ms cubic-bezier rail transition in the browser.
- Passed the shared UI type check after adding dedicated component specimens and the
  Default and Compact variant resolver.
- Passed the Platform production build, lint, authored-file line check, application
  documentation check, module documentation check, format check, and `git diff --check`.
- Verified dedicated Accordion, Combobox, and Tooltip pages in the live browser. Verified
  Compact selection updates the live composition and copyable code.
- Verified the Table block remains a default-only composed page without the component
  variant selector.
- Verified navigation from Aspect Ratio to Input Group and a browser refresh. The
  Components group stayed open and the sidebar returned to the same scroll position.
- Passed the shared UI type check, Platform production build, lint, application
  documentation check, authored-file line check, and `git diff --check` after removing
  the generic Compact variant.
- Verified the live Accordion page shows the component directly with one green Default
  badge and no preview card or generic density controls.
- Passed the shared UI type check, Platform production build, lint, application and
  module documentation checks, authored-file line check, and `git diff --check` after
  standardizing the MDI Main page.
- Verified the one-item Layout menu, shared Layout header, 90-percent live MDI preview,
  usage code, and MDI Main to Table navigation in the browser.
- Confirmed that the live MDI Main page produced no browser console warnings or errors.
- Replaced the section sampler with the shared MDI Main composition and its live UI canvas.
- Kept the embedded workspace canvas plain without Overview content or sample cards.
- Removed the extra sidebar content padding above the Overview action in both shells.
- Changed the shared Overview action to a neutral gray surface with foreground text.
- Replaced the generic MDI usage heading and paragraph with a numbered shell structure list.
- Verified the five-item MDI structure list and code spacing in Chrome.
- Bound each structure row to the existing MDI topology desk through an inspection icon.
- Verified that the Top header action opens ITO `01` with its numbered child regions in Chrome.
- Verified the embedded top menu, sidebar, canvas, status bar, and notification dropdown in Chrome.
- Passed the shared UI type check, Platform production build, focused ESLint, documentation check,
  authored-file line check, and `git diff --check` for the embedded preview update.
- Replaced the generic Accordion specimen with a fixed-width three-question FAQ and a
  copyable application example. The shared primitive now animates panel height, opacity,
  and chevron rotation with reduced-motion support.
- Passed the shared UI type check and lint, Platform production build, application
  documentation check, authored-file line check, and `git diff --check`.
- Verified all three FAQ rows in Chrome. Opening the second row closed the first and
  displayed the matching answer through the single-selection contract.
- Added a Boxed Accordion variant with one connected border and the same three FAQ rows.
  The variant control can persist either composition as the default. The code header
  copies only the current default example.
- Verified Borderless and Boxed selection in Chrome. Verified Set as default moves the
  green badge, updates the copied example, and preserves the choice after a refresh.
- Replaced the generic Alert specimen with four fixed-width semantic callouts for success,
  information, warning, and error states. The copied default code matches the live stack.
- Verified the four aligned Alert callouts, Default badge, semantic icons, and Copy default
  code in Chrome.
- Replaced the Accordion variant tabs with numbered vertical cards. Both live variants
  now stay visible. Each card owns a copy action and a popup code block.
- Verified the two numbered cards, direct copy feedback, Boxed code dialog, and default
  transfer in Chrome. Restored Borderless as the default after the check.
- Standardized all component pages on numbered variant cards. Single-variant pages now
  render `01. Default` with the same copy and popup-code actions.
- Passed the shared UI type check and lint, Platform production build, application and
  module documentation checks, authored-file line check, and `git diff --check`.
- Verified Accordion, Alert, and Button through the live gallery. Verified the shared
  code dialog and confirmed that the browser console has no warning or error.
- Passed the shared UI type check and lint, Platform production build, documentation
  checks, authored-file line check, and `git diff --check` for the Button system.
- Verified all 14 Button variants in the live gallery. Standard text buttons measured
  40px high with 20px side padding. The icon button measured 40px square.
- Verified distinct semantic tones, the Info code dialog, default transfer and restore,
  content-width sizing, pointer cursors, and a clean browser console.
