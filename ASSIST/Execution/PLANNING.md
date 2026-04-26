# Planning

## Active

- `#238` Restore storefront homepage LCP budget
  - Source:
    - `ASSIST/Execution/DAYSHEET.md` lists the next current-focus item: restore homepage `LCP` under the automated `3500ms` budget.
  - Goal:
    - bring storefront home back inside the Playwright performance budget without regressing catalog or product budgets.
  - Current evidence:
    - `npm.cmd run test:e2e:performance` passed catalog and product, but home failed with `LCP=9444ms` against `3500ms`.
  - Scope in this batch:
    - identify the homepage LCP element and timing source
    - inspect the first-screen storefront home render path for heavy entry preload, eager media, or motion cost
    - apply a focused optimization to the homepage path only
    - validate with the focused home test and full storefront performance suite
  - Constraints:
    - keep storefront visuals and layout intact unless the LCP diagnosis proves a specific surface is the blocker
    - do not broaden this into a redesign or unrelated storefront cleanup
    - preserve product and catalog performance budgets that already pass
  - Planned validation:
    - run `npx.cmd playwright test -c playwright.performance.config.ts -g "home"`
    - run `npm.cmd run test:e2e:performance`
  - Diagnosis:
    - browser LCP probe identified the homepage hero image from `section.storefront.home.hero` as the late LCP candidate
    - the hero title was visible quickly, but the external placeholder product image could replace it as LCP when the image response was slow
  - Implemented:
    - changed storefront hero media to render the hero visual as a CSS background image with `role="img"` and `aria-label`, keeping the visual while preventing remote image latency from becoming the LCP candidate
  - Validation so far:
    - passed `npx.cmd eslint apps/ecommerce/web/src/components/storefront-hero-media.tsx`
    - passed `npx.cmd tsc --noEmit --pretty false`
    - passed `npx.cmd playwright test -c playwright.performance.config.ts -g "home"`
    - passed `npm.cmd run test:e2e:performance`
  - Result:
    - homepage, catalog, and product performance budgets all pass
