# UIUX Gallery and Design System Plan

## Goal

Complete UIUX as the browser gallery for the full CODEXSUN design system.

UIUX must help a user inspect every published UI item, its variants, states,
accessibility notes, and supported preview settings.

## Scope

UIUX owns gallery composition, registry browsing, preview controls, visual
documentation, and browser checks.

`packages/ui` owns the design system. It owns tokens, theme rules, components,
blocks, pages, templates, and registry metadata.

Applications use public `@codexsun/ui` exports. UIUX also uses only these public
exports.

## Exclusions

- UIUX does not own reusable components or package internals.
- UIUX does not become a dependency of any application or package.
- UIUX does not store production theme preferences.
- UIUX does not add an API, database, authentication, Docker profile, or deployment.
- UIUX does not duplicate component source to make a preview.

## Current Baseline

The repository has a standalone `apps/uiux/web` Vite host. It lists public
`uiRegistry` metadata, filters registry layers, and provides theme and density
preview controls.

The public package already exports base controls, composition blocks, pages,
the MDI template, theme support, and registry metadata.

This plan does not mark the gallery complete until it can inspect every active
published UI item and show its declared behavior in a browser.

## Required Outcomes

1. Each active registry item has complete, validated metadata.
2. UIUX can browse components, blocks, pages, and templates by layer.
3. UIUX can show a representative rendered preview for each supported item.
4. UIUX can show variants, states, required props, and accessibility notes.
5. UIUX can apply supported preview-only theme and density settings.
6. Every application keeps a one-way dependency on `@codexsun/ui`.
7. Browser checks prove the visible gallery, controls, and previews.

## Ownership and Boundary

```text
packages/ui
  -> public @codexsun/ui exports and uiRegistry
  -> apps/uiux/web gallery

applications
  -> public @codexsun/ui exports

applications and packages
  -/-> apps/uiux/web
```

Registry metadata must not import an application. UIUX must not import private
paths from `packages/ui`.

## Delivery Phases

### Phase U-1201: Registry Completeness

Status: complete.

Audit each public UI export. Add or correct metadata for all active components,
blocks, pages, and templates.

Acceptance criteria:

- Each active public UI item has one immutable `ui.<layer>.<name>` ID.
- Metadata lists its default variant, variants, states, required props,
  accessibility notes, example data, and lifecycle status.
- Registry validation rejects invalid IDs, duplicate IDs, and invalid defaults.
- The registry stays metadata only.

Verification:

- UI package type and focused registry tests pass.
- The registry count matches the active public UI exports.

### Phase U-1202: Gallery Navigation and Detail

Status: complete.

Build a clear gallery index and item detail experience from the public registry.

Acceptance criteria:

- A user can filter all four layers.
- A user can open an item and inspect its metadata.
- Empty, loading, unavailable, and deprecated metadata states are readable.
- Navigation works with keyboard focus and accessible names.

Verification:

- UIUX type and lint checks pass.
- A browser test covers layer filtering and item detail.

### Phase U-1203: Published Item Previews

Add representative previews for every active registry item through public
`@codexsun/ui` exports.

Acceptance criteria:

- Each preview uses only public exports.
- Each preview uses declared example data and required props.
- Supported variants and states are visible where they have a visual effect.
- A missing preview has a clear diagnostic and blocks completion.

Verification:

- Focused UI tests cover preview mappings.
- A browser test renders at least one item from each layer.

### Phase U-1204: Preview Controls and Theme Coverage

Complete preview-only controls for supported theme and density values.

Acceptance criteria:

- The Tweak panel applies only approved theme and density values.
- Dark and light themes keep text, borders, focus, and semantic state readable.
- Compact, default, and relaxed density remain usable.
- Preview settings do not write production application preferences.

Verification:

- Theme contract tests pass.
- Browser checks cover both themes and all density options.

### Phase U-1205: Boundary Audit and Handoff

Add and run a repository boundary audit for shared UI use.

Acceptance criteria:

- Non-UIUX applications cannot depend on or import UIUX.
- Applications cannot import private `packages/ui` files.
- Applications use published `@codexsun/ui` exports for reusable controls.
- Verification evidence records commands, results, date, and limits.

Verification:

- Boundary audit, UI package checks, UIUX checks, and `git diff --check` pass.
- A browser flow proves the gallery, detail, previews, and Tweak panel.

## Implementation Order

Complete U-1201 through U-1205 in order. Do not add preview mappings before the
registry describes the published item.

## Open Decisions

1. Confirm whether UIUX needs per-item routes or an in-page detail panel.
2. Confirm whether deprecated entries stay visible by default.
3. Confirm the first required component interaction previews.
4. Confirm the final repository command that enforces shared UI boundaries.
