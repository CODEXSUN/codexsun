# UI Design System Registry

## Outcome

The shared UI package now owns a typed registry for components, blocks, variants, and pinned
defaults. The UI Overview renders each registered component's real default specimen.

## Authoritative references

- Owner README: `packages/ui/README.md`
- Application catalog: `assist/modules/platform.md`
- Architecture contract: `assist/architecture/ui-design-system.md`
- Local skill: `assist/skills/ui-template-pages.md`

## Ownership and boundaries

`packages/ui` owns shared tokens, primitives, compositions, blocks, layouts, defaults, and
registry metadata. Platform owns the `/ui` route. Applications own business composition.

Applications import public `@codexsun/ui` paths. They cannot import Base UI, CVA, or private
package source. They cannot own a duplicate shared primitive directory.

## Binding properties

| Producer            | Consumer              | Binding                           | Version or key                 |
| ------------------- | --------------------- | --------------------------------- | ------------------------------ |
| Component registry  | UI navigation         | Component name and package path   | `designSystemComponents`       |
| Block registry      | UI block navigation   | Block name and package path       | `designSystemBlocks`           |
| Default registry    | UI Overview           | Pinned default variant            | `defaultDesignSystemSelection` |
| Selection resolver  | Application setup     | Validated variant override        | `createDesignSystemSelection`  |
| Action intent map   | Application actions   | Typed Button variant              | `resolveActionVariant`         |
| UI boundary checker | Repository validation | Public import and ownership rules | `check:ui-system`              |

## Parallel work

The worktree contains Zetro and Orship changes. This change does not edit their behavior or
data. The boundary checker reads web sources but does not rewrite application files.

## Decisions

- Keep small controls as typed primitives with named properties.
- Do not create semantic Button wrapper components.
- Map business action intent to Button variants without wrapper components.
- Put large reusable surfaces in package-owned block folders.
- Keep the design-system registry independent from the documentation template.
- Derive gallery metadata from the registry.
- Render real pinned defaults on the UI Overview.
- Fail when an app requests an unknown design-system item or variant.
- Check static ownership boundaries in the root validation command.

## Verification

- Command: `npm.cmd run typecheck --workspace @codexsun/ui`
- Result: Passed.
- Command: `npm.cmd run check:ui-system`
- Result: Passed.
- Browser: Verified 61 real component defaults, two block links, all eight categories,
  public source paths, no placeholder copy, no horizontal overflow, and no new console errors.
- Platform build: Blocked by the concurrent Identity login contract. The hook sends `email`,
  but the current request type accepts `identifier`.
- Module dependency check: Blocked by concurrent Zetro work. `zetro.tasks.api@0.5.0`
  does not satisfy the web module's current `^0.4.0` requirement.
- Not run: Full repository checks because the consuming Platform build is blocked.

## Follow-up work

Move new reusable UI into the registry as it is added. Keep business-only compositions in
their owning application modules.
