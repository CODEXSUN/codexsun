# Shared Design System and Workspace Blocks

## Outcome

The shared UI package now owns the application theme system and reusable workspace cards.
All MDI applications receive the same mode, color, and semantic token behavior.
The live UI Gallery shows the new blocks.

## Authoritative references

- Owner README: `packages/ui/README.md`
- Layout contract: `packages/ui/src/layouts/README.md`
- Gallery module: `apps/platform/web/src/modules/ui-gallery/README.md`
- Local skill: `assist/skills/web-ui.md`

## Ownership and boundaries

`packages/ui` owns theme state, storage keys, color tokens, selectors, and reusable blocks.
Applications own business values, actions, routes, and workflows passed into the blocks.
The shared package does not contain business entities or application data access.

## Binding properties

| Producer        | Consumer      | Binding                                      | Version or key                    |
| --------------- | ------------- | -------------------------------------------- | --------------------------------- |
| `ThemeProvider` | Document root | Light, dark, or system mode                  | `codexsun.ui.theme`               |
| `ThemeProvider` | Document root | Semantic accent composition                  | `codexsun.ui.color-theme`         |
| `MdiMain`       | All web apps  | Shared provider and appearance selector      | `@codexsun/ui/theme`              |
| Application     | UI blocks     | Labels, values, actions, icons, and children | `@codexsun/ui/blocks/workspace`   |
| UI Gallery      | Shared UI     | Live block previews                          | `gallery.preview.workspaceBlocks` |

## Reference review

The implementation reviewed `E:\Workspace\codexsun\cxapp` as requested.
It adopted semantic OKLCH tokens, persistent root attributes, and reusable card composition.
It did not copy CXApp business modules or its overlapping design variants.

## Decisions

- Use light, dark, and system as separate color modes.
- Use neutral as the default accent composition.
- Offer blue, violet, emerald, and orange as restrained alternatives.
- Store mode and accent choices under package-owned keys.
- Use semantic tokens for state and chart colors.
- Build reusable blocks from shadcn primitives and Tailwind utilities.
- Keep page headers, metrics, sections, and actions free of business behavior.
- Bind the provider once in `MdiMain` instead of copying it into each application.
- Keep the selector inside the existing appearance panel.
- Expose the same persisted mode as a compact System, Light, and Dark cycle in
  the shared profile panel.
- Match Base UI Tabs against its `data-orientation` attribute.

## Parallel work

The worktree contains concurrent Docs, DevKit, Zetro, runtime, and data-table changes.
This work preserves those files and uses only their public MDI binding.

## Verification

- Passed the complete workspace TypeScript check.
- Passed the aggregate production build and the focused API build.
- Passed lint, formatting, authored-file length, module documentation, application
  documentation, workspace layout, and production chunk-budget checks.
- Passed the complete root `check` gate, including 11 framework tests, 3 web
  composition tests, and 6 server and Platform API tests.
- Verified the Platform UI Gallery in the browser at `/ui?design-check=1`.
- Verified the block preview, corrected horizontal Tabs composition, and confirmed
  light, dark, system, and accent selector states.
- Confirmed Dark and Violet persisted after a full browser reload, then restored
  the preview to System and Neutral.
- Verified the profile control cycles Light to Dark to System, updates its icon
  and accessible label at each step, and preserves System after reload.
- Passed the complete root check after adding the profile theme cycle.

## Follow-up work

Applications can replace local presentation-only cards with these blocks during module work.
