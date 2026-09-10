# Sidebar integration

## Outcome

Integrated the isolated sidebar task into the main working checkout through shared UI.
The original worktree remains untouched. Its app-local visual classes were not copied.
Agent Chat 0.13.3 uses the existing public Sidebar menu primitive with a new named variant.
The shared activity rail now has a visible primary-color marker and outlined selected surface.

## References and bindings

- [Agent Chat](../../../../apps/zetro/web/src/modules/agent-chat/README.md) owns conversation state, selection, and menu actions.
- [Shared UI](../../../../packages/ui/README.md) owns `SidebarMenuButton` and `AgentActivityRail`.
- `variant="accented"` and `size="comfortable"` provide left-aligned 40px rows and selected markers.
- Zetro passes `isActive`, `aria-current`, title, disabled state, and its existing callback.
- No API, database, migration, or permission behavior changed.

## Parallel work

Preserved pending Chat streaming, shared-package scopes, and startup readiness changes.
The isolated worktree cannot run tool checks without dependencies. Validation ran in the root dependency-ready checkout.
No duplicate node_modules folder was created. Build artifacts remain below root dist.

## Verification

Shared rendering tests cover selected semantics, disabled rows, truncation classes, and the activity-rail marker.
Ten shared UI tests pass. Zetro web typecheck, shared/app lint, web build, and file-length checks pass.
The web build reports no warnings. Its main chunk is 373.10 kB.
Live browser checks confirm 40px left-aligned rows and selection changes by click and Enter.
The selected marker changes from opacity 0 to 1. Long stored titles truncate inside the row.
A screenshot confirms the label and action lanes and visible activity-rail selection.
The development API still returns 404 for sandbox status. This existing mismatch is outside the sidebar change.
The installed desktop has not been replaced. No commit, push, installer, or installation was performed.

## Decision

Use the existing sidebar primitive instead of introducing a duplicate chat-row component.
Keep selection styling inside packages/ui and data/actions inside Zetro.
