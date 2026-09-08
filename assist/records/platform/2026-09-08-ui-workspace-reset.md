# UI Workspace Reset

## Outcome

Platform `/ui` now opens as a plain Overview canvas. The sidebar shows Overview
in the former primary-action position and no application navigation group.

## Authoritative references

- Owner README: `apps/platform/web/src/modules/ui-gallery/README.md`
- Application catalog: `assist/modules/platform.md`
- Shared layout contract: `packages/ui/src/layouts/README.md`
- Local skill: `assist/skills/web-ui.md`

## Ownership and boundaries

The Platform UI workspace module owns the blank route surface. `MdiMain` owns
the sidebar shell and accepts the application-owned Overview action. Shared UI
components and design tokens remain in `packages/ui` for later workspace work.

## Binding properties

| Producer           | Consumer    | Binding                 | Version or key  |
| ------------------ | ----------- | ----------------------- | --------------- |
| UI workspace       | Router      | Plain workspace route   | `/ui`           |
| Platform app       | `MdiMain`   | Empty navigation        | `navigation`    |
| Platform app       | MDI sidebar | Overview primary action | `primaryAction` |
| `MdiPrimaryAction` | MDI sidebar | Optional action icon    | `icon`          |

## Parallel work

The worktree contains concurrent Docs, DevKit, Zetro, runtime, topology, and
shared table changes. This reset does not alter those modules or their data.

## Decisions

- Keep the central UI source and remove only its current `/ui` presentation.
- Keep Feature settings and the shared appearance control available.
- Use the primary-action slot so Overview occupies the former New workspace position.
- Keep the stable `ui-gallery` module ID and package export during the visual reset.

## Verification

- Passed focused shared UI and Platform web type checks and production builds.
- Verified `/ui?design-check=1` in the browser. The canvas is blank, Overview is
  in the former action position, and no navigation heading or route menu remains.
- Passed the complete root `check` gate, including workspace layout, formatting,
  lint, type checks, builds, the production chunk budget, and 20 automated tests.
- Passed `git diff --check`.

## Follow-up work

Build the Overview workspace only after its next screen composition is approved.
