# Agent Workspace Layout

## Outcome

The shared UI package now owns the Agent Workspace layout. It places two fixed icon rails around
one center canvas and connects their visibility to MDI feature settings.

## Authoritative references

- Owner README: `packages/ui/README.md`
- Layout guide: `packages/ui/src/layouts/README.md`
- Web UI skill: `assist/skills/web-ui.md`
- UI template skill: `assist/skills/ui-template-pages.md`

## Ownership

`packages/ui` owns the rail structure, spacing, accessible tooltips, active state, badges, and
visibility motion. Applications own agent records, routes, selected tool state, and actions.

## Public contract

| Producer             | Consumer               | Binding                | Public key             |
| -------------------- | ---------------------- | ---------------------- | ---------------------- |
| Agent Workspace      | MDI Main               | Optional center layout | `agentWorkspace`       |
| Application          | Primary Activity Rail  | Typed icon items       | `primaryRail`          |
| Application          | Secondary Utility Rail | Typed icon items       | `secondaryRail`        |
| MDI feature settings | Agent Workspace        | Rail visibility        | `primaryActivityRail`  |
| MDI feature settings | Agent Workspace        | Rail visibility        | `secondaryUtilityRail` |

## Decisions

- Name the complete layout Agent Workspace.
- Name the left tool strip Primary Activity Rail.
- Name the right tool strip Secondary Utility Rail.
- Keep both rails fixed inside the workspace boundary.
- Keep the Primary Activity Rail visible when MDI navigation collapses; the navigation toggle owns
  only the default sidebar.
- Keep the center canvas flexible and application-owned.
- Accept typed rail data instead of hard-coded agent menus.
- Show rail switches only when MDI Main receives an Agent Workspace configuration.
- Order the shell as Primary Activity Rail, default sidebar, center canvas, and Secondary Utility Rail.

## Verification

- `npm.cmd run typecheck --workspace @codexsun/ui`: Passed.
- `npm.cmd run lint --workspace @codexsun/ui`: Passed.
- `npm.cmd run build --workspace @codexsun/ui`: Passed.
- `npm.cmd run build --workspace @codexsun/platform-web`: Passed.
- `npm.cmd run check:ui-system`: Passed.
- Browser: Verified two 56px rails, a flexible center canvas, and no horizontal overflow.
- Browser: Verified the order as Primary Activity Rail, default sidebar, canvas, and utility rail.
- Browser: Verified that each feature switch hides its rail at zero width.
- Browser: Verified that collapsing MDI navigation leaves the 56px Primary Activity Rail and all
  rail actions visible while the default sidebar collapses to zero width.
- Browser: Restored both rail switches after the visibility checks.
