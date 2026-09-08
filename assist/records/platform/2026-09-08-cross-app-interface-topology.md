# Cross-App Interface Topology

## Outcome

All current browser apps use the shared Interface Topology Inspection feature.
The inspector combines the shared MDI shell registry with each app registry.

## Shared ownership

- `packages/ui` owns the inspector, markers, registry validation, and MDI shell items.
- Each app owns its page, feature, and business control items.
- `MdiMain` combines both registries through the `topologySections` property.
- App components access the combined controller through `useMdiTopology`.

## Coverage

- Platform covers the System workspace and UI Gallery.
- Docs covers the Library, reader, overview, unavailable, and Ideas workspaces.
- Zetro covers Chat, Tasks, Settings, and customization.
- MDI covers the command bar, sidebar, workspace, status bar, appearance control, and feature settings.

## Identification rules

- Parent regions show named glass banners when labels are visible.
- Child items show compact numbered stickers during focused inspection.
- Every technical name uses `section.block.control`.
- Registry validation rejects duplicate IDs, duplicate names, malformed names, and missing parents.

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
