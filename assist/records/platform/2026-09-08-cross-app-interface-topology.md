# Cross-App Interface Topology

## Outcome

All current browser apps use the shared Interface Topology Inspection feature.
The inspector separates the shared MDI registry from each app registry.

## Shared ownership

- `packages/ui` owns the inspector, markers, registry validation, and MDI shell items.
- Each app owns its page, feature, and business control items.
- `MdiMain` creates MDI Overview and the active application desk.
- App components access the desk-aware controller through `useMdiTopology`.

## Coverage

- Platform covers the System workspace and UI Gallery.
- Docs covers the Library, reader, overview, unavailable, and Ideas workspaces.
- Zetro currently covers only the empty Zetro Desk region.
- MDI covers the command bar, sidebar, workspace, status bar, appearance control, and feature settings.

## Identification rules

- Parent regions show named glass banners when labels are visible.
- Child items show compact numbered stickers during focused inspection.
- Inspecting a parent shows all direct child number stickers on the page.
- The selected technical name is a visible copy-to-clipboard button.
- Every technical name uses `section.block.control`.
- Registry validation rejects duplicate IDs, duplicate names, malformed names, and missing parents.
- A shadcn Select switches between topology desks.
- The selected section shows only its name and copyable technical name.

## MDI sidebar refinement

- The sidebar no longer repeats the application identity from the command bar.
- The primary action and navigation use the full sidebar height.
- The ITO inspector and launcher sit higher to keep their lower edges visible.
- Shared ITO and MDI changes use Tailwind utilities without new custom CSS.

## Database and API changes

- Database update: No.
- API update: No.

## Verification

- Passed the shared UI, Platform web, Docs web, and Zetro web type checks.
- Opened Platform UI Gallery at `http://127.0.0.1:6021/ui`.
- Confirmed named shell and gallery banners and the combined white inspector.
- Opened Docs at `http://127.0.0.1:6040/`.
- Confirmed the Docs Library and Ideas groups in the combined inspector.
- Opened Zetro Chat and Settings at `http://127.0.0.1:6060/`.
- Confirmed the Chat, Tasks, Settings, and customization groups.
- Expanded the Settings device flow through level three and confirmed all four controls.
- Passed the complete root `npm.cmd run check` gate.

## Current refinement verification

- Opened Zetro Desk at `http://127.0.0.1:6060/zetro` in Chrome.
- Confirmed that the sidebar identity banner is absent.
- Selected Application sidebar and confirmed child stickers `02.2` through `02.5`.
- Copied `mdi.navigation.sidebar` and confirmed the visible Copied state.
- Confirmed that the raised inspector fits above the lower page edge.
- Passed the Zetro web type check, build, tests, lint, documentation, line, and diff checks.
- Formatted all files changed for this refinement.
- Root typecheck remains blocked by concurrent DevKit contract and shared data-table errors.
- Root format check remains blocked by concurrent DevKit and shared data-table files.
