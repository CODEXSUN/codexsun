# ITO Desk Selector

## Outcome

The Interface Topology inspector now separates shared and app-owned regions.
A shadcn Select switches between the active application desk and MDI Overview.
The Select is hidden when a page exposes only one application desk.

## Ownership

- MDI Overview owns command bar, sidebar, canvas, status, appearance, and feature regions.
- Each application desk owns only its page and business regions.
- The shared ITO controller owns desk selection and marker-to-desk routing.

## Interface changes

- Removed the inspector title, scope label, and description helper text.
- Kept the selected section name and copyable technical name.
- Reduced the panel width and shadow.
- Clicking a marker opens the desk that owns that marker.
- Markers render only for the selected desk.
- Shifted the Zetro Desk marker below the shared canvas marker.

## Database and API changes

- Database update: No.
- API update: No.

## Verification

Run shared UI and application type checks and builds. Open the inspector in
Zetro. Confirm Zetro Desk shows group `15` with workspace `15.1` and sidebar
`15.2` without a selector.
Open Platform `/overview`, select MDI Overview, and confirm that it shows only
shared shell regions.
