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
