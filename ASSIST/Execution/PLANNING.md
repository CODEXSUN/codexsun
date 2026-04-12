# Planning

## Active Batch

- `#132` Add menu logo variant toggles and global-loader designer controls
  - Scope: expand the menu designer so each runtime logo surface can explicitly choose the light or dark brand logo, and add a dedicated global-loader logo design surface with the same sizing and position controls.
  - Constraint: keep fresh defaults aligned to the current live behavior so existing storefronts do not visually change until an operator edits the new controls.
  - Assumption: the requested global-loader positioning should follow the same frame-and-offset model as the app menu, but appear as its own editable surface beneath the app-menu section in the designer.
  - Phase 1: track the new menu-designer scope in ASSIST before code changes. Completed.
  - Phase 2: extend the shared menu-designer settings with per-surface light or dark logo selection and a global-loader logo design surface. Completed by adding `logoVariant` to each menu surface and introducing a new `globalLoader` surface in the shared schema, seed defaults, and storefront-settings merge logic.
  - Phase 3: update the menu editor and runtime consumers, then validate and record the batch. Completed by adding light-or-dark toggle controls to each menu surface editor, adding a dedicated global-loader editor below the app-menu section, and wiring top menu, footer, app sidebar, and global loader runtime consumers to the selected logo variant. Validated with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`.
- `#132` Restore the ecommerce menu-editor Global loader preview to the real shared loader
  - Scope: replace the static loader mock in the ecommerce menu editor with the actual shared `GlobalLoader` so operators adjust the same animated runtime surface they publish.
  - Constraint: preserve the new light-or-dark loader logo selection and keep the editor capable of previewing draft brand assets before publish.
  - Assumption: the shared loader should keep its network-backed runtime behavior by default, but accept explicit preview overrides when the ecommerce editor needs to render unsaved draft settings locally.
  - Phase 1: document the live-preview follow-up in ASSIST before code changes. Completed.
  - Phase 2: let the shared loader accept preview overrides for draft menu settings and brand assets. Completed by adding optional `designOverride` and `brandOverride` props to the shared loader while keeping the runtime fetch-backed behavior as the default path.
  - Phase 3: replace the static ecommerce loader mock with the real shared loader and revalidate the affected paths. Completed by rendering `GlobalLoader` inside the menu editor preview with the current draft loader surface and preview brand assets. Validated with `npm.cmd run typecheck`.
- `#132` Tighten menu-editor publish flow and action controls
  - Scope: replace the current logo-tone buttons with a switch-style control, align the action buttons into a single row, and make the top-level publish action execute the full menu-and-brand publish sequence.
  - Constraint: keep standalone save and logo-publish actions available while preventing the combined publish path from reloading the page before storefront settings are published.
  - Assumption: the intended operator workflow is that `Publish live` is the one-click final action, so it should internally perform menu save, brand draft save, brand publish, and storefront publish in order with one success path.
  - Phase 1: track the combined publish-flow and control-layout follow-up in ASSIST. Completed.
  - Phase 2: replace the logo-tone button pair with a switch-style control and compress the action buttons into one row. Completed by changing the surface tone control to a `Switch`-based toggle and moving logo draft, logo publish, publish live, and save menu designer into one shared action bar.
  - Phase 3: make `Publish live` run save menu designer, save logo draft, publish logo live, and publish storefront live in sequence, then validate. Completed by making the combined publish path reuse the existing save and publish operations in order, suppressing the intermediate brand publish reload, and reloading only after the full sequence succeeds. Validated with `npm.cmd run typecheck`.
- `#132` Hard-center the global-loader logo placement
  - Scope: anchor the global-loader logo from the exact center point of the spinner so the saved offsets move from a true center baseline.
  - Constraint: keep the existing size and offset controls working while tightening only the base placement logic.
  - Assumption: explicit center anchoring is safer than relying on flex centering once translated logo sizes vary.
  - Phase 1: track the center-placement follow-up in ASSIST. Completed.
  - Phase 2: update the shared global loader to anchor the logo from the exact center point. Completed by anchoring the loader logo at `50% / 50%` and applying saved offsets from that center point instead of relying on flex centering.
  - Phase 3: validate the centered loader placement and record the result. Completed with `npm.cmd run typecheck`.
