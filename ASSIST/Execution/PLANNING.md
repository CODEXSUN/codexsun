# Planning

## Active

- `#223` Manual full-load storefront verification
  - Goal:
    - verify the full storefront load and core commerce flow after the first-render optimization so the next slice is based on real user-visible behavior
  - Why this slice now:
    - storefront smoke and automated performance checks are stable enough
    - the next useful signal should come from manual full-load verification rather than more blind tuning
  - Manual verification scope:
    - homepage full load including hero, top menu, category menu, and footer
    - homepage lower sections after full load and scroll
    - catalog full load
    - PDP full load
    - cart, checkout, and tracking flow
    - late render or layout jump confirmation
    - local email expectation confirmation for launch
  - Constraints:
    - keep the active tracking aligned to the current manual verification task
    - do not start the next preload or motion optimization slice until the manual storefront result is confirmed
