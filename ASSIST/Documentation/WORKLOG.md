# Work Log

## Done Till Here

### `#22` 2026-04-04

- cleaned app ownership between `cxapp`, `framework`, and `core`
- moved auth, bootstrap, company, mailbox, and related suite state into `cxapp`
- reduced `core` to shared masters and reusable common modules

### `#23` 2026-04-04

- reset `ecommerce` to a scaffold-only boundary so it could be rebuilt cleanly

### `#24` 2026-04-04

- rebuilt `ecommerce` as a live storefront app on top of shared `core` products and contacts
- added landing, catalog, PDP, cart, checkout, tracking, registration, portal, orders, and Razorpay-ready checkout flows
- added ecommerce admin workspace sections and shared commerce UI primitives
- introduced frontend surface switching for `site`, `shop`, and `app`
- normalized public and admin route shapes such as `/admin/dashboard` and `/profile`

### `#25` 2026-04-05

- consolidated the platform to one login and session system owned by `cxapp`
- removed the separate ecommerce customer JWT and browser session flow
- linked ecommerce customer accounts to shared `cxapp` auth users
- routed login by role: admin -> `/admin/dashboard`, desk user -> `/dashboard`, customer -> `/profile`
- blocked customers from staying on desk routes and blocked desk users from staying on customer-only portal routes
- fixed env precedence so process env overrides `.env`, which makes isolated Playwright server ports reliable again
- added browser e2e coverage for admin, operator, customer, and billing login flows

### `#26` 2026-04-05

- added frontend home switching for `site`, `shop`, and `app`, then normalized public, admin, and customer route shapes around `/admin/dashboard`, `/dashboard`, and `/profile`
- rebuilt ecommerce admin navigation so products and shared product masters from `core` stay inside the ecommerce workspace instead of switching the sidebar to `core`
- connected ecommerce storefront settings to a real backend settings service and hardened partial saves against legacy rows and missing nested objects
- reshaped the storefront shell to the requested temp/reference tone with a richer top menu, search, category rail, footer, product cards, and multiple hero-slider iterations
- added a dedicated mobile hero slider with image-first ordering, top-mounted badge and chevrons, and mobile-sized typography and actions
- split the main frontend entry into route-level chunks so production build no longer warns about the oversized initial bundle
