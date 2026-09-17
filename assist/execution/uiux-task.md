# UIUX Task Register

Read [uiux-planning.md](uiux-planning.md) before starting a UIUX task.

## Active Work

No UIUX task is active.

## Task Rules

1. Start one task only after the user confirms its exact ID.
2. Keep one task in `packages/ui` or `apps/uiux/web`.
3. Use only public `@codexsun/ui` imports across this boundary.
4. Do not make UIUX a dependency of an application or package.
5. Record browser-visible verification for every UIUX change.
6. Update this register, the plan, local README files, and the changelog after completion.

## Planned Tasks

| Task | Owner | Scope | Data impact | Required verification | State |
| --- | --- | --- | --- | --- | --- |
| U-1201 | UI package | Complete and validate active registry metadata. | No | UI types and registry tests. | Complete. |
| U-1202 | UIUX web | Add accessible gallery navigation and item detail. | No | UIUX checks and browser filter flow. | Complete. |
| U-1203 | UIUX web | Map every active item to a public-export preview. | No | Preview tests and browser layer previews. | Planned. Requires confirmation. |
| U-1204 | UI package and UIUX web | Complete supported preview controls and visual theme coverage. | No | Theme tests and browser theme-density flow. | Planned. Requires confirmation. |
| U-1205 | Repository tools | Add and run the shared UI boundary audit. | No | Boundary audit, focused checks, browser flow, and diff check. | Planned. Requires confirmation. |

## Task Completion Rule

Mark a task complete only after its acceptance criteria and required checks in
[uiux-planning.md](uiux-planning.md) pass. Record evidence, risks, and
untested paths in the active changelog entry.
