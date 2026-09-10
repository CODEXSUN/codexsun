# UI Design System Standard

## Purpose

The CODEXSUN UI design system gives every web application one source for visual behavior.
The `packages/ui` workspace is the only source owner for reusable web UI. Applications
consume public package exports.

## Layer model

1. Tokens define color, type, spacing, radius, elevation, and motion.
2. Primitives define one accessible interaction, such as Button, Input, or Dialog.
3. Compositions connect primitives, such as Button Group or a lookup field.
4. Blocks define reusable application surfaces, such as Form and Table.
5. Layouts define the application shell, such as MDI Main.
6. Templates document the real exports. Templates do not own alternate implementations.

## Small and large components

Keep a small control as one physical component with typed properties. Button uses `variant`
and `size`. Do not create `PrimaryButton`, `SecondaryButton`, or similar wrappers.

Move a large reusable experience into its own block folder. Give the block typed data,
slots, state, and callbacks. Keep business fields, routes, persistence, and workflows in the app.

Use a named helper or child component when one source file gets multiple responsibilities.
Do not use a large conditional component to implement unrelated controls or business states.

## Registry contract

`@codexsun/ui/design-system` exports the component registry, block registry, pinned defaults,
and selection resolver. The registry is the source for names, categories, package paths,
supported variants, and default variants.

The page registry applies the same contract to reusable full-page compositions. A page family
owns its supported variants and pinned default. Applications select a page variant but continue
to own routes, API calls, session state, persistence, and business policy.

Use `createDesignSystemSelection` to validate app-selected defaults. The resolver rejects an
unknown component, block, or variant. An application can request a supported variant. It cannot
define a new shared variant outside `packages/ui`.

Use `resolveActionVariant` when application code starts with an action intent. The shared map
converts `primary`, `alternative`, `positive`, `caution`, and other intents to Button variants.
Do not implement this mapping with application conditions or wrapper components.

## Application boundary

- Import shared UI only from an `@codexsun/ui` public export.
- Search the registry before creating a component, form, block, layout, or variant.
- Add every missing reusable UI implementation to `packages/ui`.
- Keep business data, fields, validation, routes, permissions, callbacks, workflows,
  and screen composition in their owning application module.
- Pass application-owned values to typed package components and blocks.
- Do not import Base UI or CVA directly in an application.
- Do not create an app-local `src/components/ui` copy.
- Do not create an app-local reusable form framework, block, layout, or visual variant.
- Do not copy shared variant class strings into an application.
- Do not import a private `packages/ui/src` path.
- Do not import source or exports from the UIUX application.
- Do not depend on `@codexsun/uiux-web`. Use public `@codexsun/ui` exports.

The `check:ui-system` command checks import, dependency, ownership, and directory boundaries.
Code review checks visual duplication that static analysis cannot identify safely.

## Documentation contract

The UI Overview renders each registered component through its real package export and pinned
default. A component page shows its registered compositions. A block page renders the actual
block. Documentation code must use public package paths.

When the registry supports multiple variants, the component page can show each variant. A block
uses only the pinned default unless its public contract accepts a variant.

## Change workflow

1. Search the registry and public exports.
2. Select an existing primitive, composition, block, or layout.
3. Add a package-owned variant when the behavior is reusable.
4. Add a package-owned block when several primitives form one reusable surface.
5. Register the source, variants, and pinned default.
6. Add the real default specimen to the UI Overview.
7. Update the owner README, UI skill, development record, and changelog.
8. Run `npm.cmd run check:ui-system`, UI checks, and the consuming app build.
