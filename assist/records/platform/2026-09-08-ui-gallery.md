# Shared UI Gallery and Interface Topology

## Outcome

Platform provides a runnable UI Gallery at `/ui`.

The shared UI package owns the template and Interface Topology Inspection feature.

## Ownership

- `packages/ui` owns the gallery, previews, component inventory, templates, and topology feature.
- The Platform UI Gallery module owns the route and navigation contribution.
- The module owns no API contract, database table, or business workflow.

## Public contracts

- Gallery template: `@codexsun/ui/templates/ui-gallery`.
- Topology feature: `@codexsun/ui/features/interface-topology`.
- Layout host: `@codexsun/ui/layouts/mdi-main`.

## Interface topology

- Every registry item uses a stable `section.block.control` technical name.
- The label switch stores its value in browser local storage.
- Selecting a label opens the inspector and selects the mapped region.
- The selected region gets a two-pixel purple inner ring.
- The floating inspector uses a white surface with purple labels and controls.
- The numbered stickers use contrasting green, blue, amber, teal, and related colors.

## Browser verification

- Opened `http://127.0.0.1:6021/ui` in the local browser.
- Confirmed all 62 component modules and four templates appear.
- Filtered the inventory to the Chart component.
- Opened the Forms preview and confirmed its live controls.
- Opened the topology inspector and enabled its numbered labels.
- Selected the Component Filter label and confirmed the selected detail and boundary ring.

## Database and API verification

- Database update: No.
- API update: No.
