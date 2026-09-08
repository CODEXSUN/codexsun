# Dynamic MDI Sidebar

## Outcome

The shared MDI sidebar can render application-owned content and an optional
application-owned footer. Zetro now supplies an empty Desk sidebar through this
contract so it can be built independently in later work.

## Authoritative references

- Owner README: `packages/ui/src/layouts/README.md`
- Application module README: `apps/zetro/web/src/modules/desk/README.md`
- Application catalog: `assist/modules/zetro.md`
- Local skill: `assist/skills/web-ui.md`

## Ownership and boundaries

`packages/ui` owns sidebar sizing, scrolling, collapse behavior, and the rail
toggle. An application owns every element that it passes to the content or
footer slot. Zetro owns `ZetroDeskSidebar`. The shared package does not import
Zetro source or know its future navigation behavior.

## Binding properties

| Producer    | Consumer       | Binding           | Version or key                    |
| ----------- | -------------- | ----------------- | --------------------------------- |
| Application | `MdiMain`      | Sidebar content   | `sidebarContent`                  |
| Application | `MdiMain`      | Sidebar footer    | `sidebarFooter`                   |
| Zetro Desk  | MDI sidebar    | Empty app surface | `ZetroDeskSidebar`                |
| Platform    | ITO controller | Shared shell desk | `/overview` and `showMdiOverview` |
| Zetro Desk  | MDI main area  | Whole-desk group  | `deskRegionId="15"`               |

An omitted content property keeps the standard primary action and navigation.
An omitted footer property keeps Feature settings. A `null` footer removes it.
A React node replaces either surface.

## Parallel work

The worktree contains concurrent Zetro cleanup, Docs, DevKit, runtime, and
shared UI changes. This change preserves those edits and extends their current
composition contracts.

## Decisions

- Keep the shared sidebar shell responsible for layout behavior.
- Let each application own the content rendered inside the shell.
- Keep existing MDI sidebar content as the compatible default.
- Hide the ITO desk selector when only one desk is available.
- Render labels only for the selected desk.
- Expose the shared MDI topology only on Platform `/overview`.
- Keep the Zetro sidebar empty until its controls are designed.
- Model Zetro Desk as the whole-page group with workspace and sidebar children.

## Database and API changes

- Database update: No.
- API update: No.

## Verification

- Passed shared UI, Platform web, and Zetro web type checks and builds.
- Passed focused lint, formatting, file-length, documentation, build-output,
  and diff checks.
- Opened Zetro `/zetro`. The sidebar is empty, has no Feature settings footer,
  and ITO shows the Zetro Desk group with only workspace and sidebar children
  and no selector.
- Opened Platform `/overview`. ITO starts with the complete MDI Overview tree
  and offers the desk selector.

## Follow-up work

Add Zetro sidebar controls only after their screen design is approved.
