# Planning

## Active

- `#229` Finalize storefront home merchandising and overflow hardening
  - Goal:
    - finish the storefront home merchandising batch, including new editorial sections, marquee-style brand treatment, responsive sizing cleanup, and the remaining scroll-width hardening around the gift-area path
  - Why this slice now:
    - the storefront home changed substantially in this batch and needs one clean release reference that covers both the new merchandising surfaces and the follow-up layout hardening work
  - Scope in this batch:
    - keep the new `discoveryBoard` and `visualStrip` surfaces editable from ecommerce admin
    - keep the storefront home lighter and more consistent across desktop, medium, and mobile widths
    - contain below-fold overflow from decorative sections, rails, and the brand marquee so the page does not visually expand while scrolling
  - Constraints:
    - keep the implementation inside existing ecommerce storefront patterns
    - do not create a parallel settings system outside the storefront settings service
    - keep the cards image-led and light, with no visible text inside the image cards
    - prefer containment, deferred-load timing, and shared frame fixes over broad storefront rewrites
  - Planned implementation:
    - `Discovery Board`: section heading plus `4` collage cards in a row, each card holding `4` images and an optional click target
    - `Visual Strip`: section heading plus a compact horizontal image rail with small cards and minimal corner radius
    - standalone routes under ecommerce workspace for each designer
    - shared storefront frame and shell hardening for consistent width
    - later-mount behavior for rail sections and stronger marquee containment
  - Implemented in this batch:
    - added shared storefront schemas, defaults, and settings-service save/read helpers for `discoveryBoard` and `visualStrip`
    - added internal ecommerce routes, web API methods, sidebar items, and workspace routes for standalone admin editing
    - added reusable `apps/ui` blocks and lazy-mounted the new sections on the storefront home page
    - converted the storefront brand-showcase surface from a story-card rail into a marquee-style brand slider using a shared marquee UI utility
    - tightened storefront home first render, hero/lane behavior, featured defaults, and medium/mobile layout handling
    - moved the shared storefront home frame to a Tailwind `container`-based width and clipped the coupon-banner and gift-corner visuals so below-fold sections cannot widen the page while mounting
    - hardened the storefront shell with `overflow-x-hidden`, later-mount timing for rail sections, and additional marquee containment at the root and component levels
    - validated the storefront slice with `npx vite build`
  - Known validation limit:
    - global `npm run typecheck` still fails in `apps/billing/web/src/workspace-sections/index.tsx` on pre-existing unrelated billing type errors
