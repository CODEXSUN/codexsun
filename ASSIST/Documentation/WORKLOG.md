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
- added a dedicated ecommerce-owned Home Slider designer, backend route, and persisted theme settings for hero gradients, buttons, navigation, and frame styling
- evolved the Home Slider admin into a multi-slide list so each storefront hero slot can keep its own isolated theme settings
- reshaped the storefront shell to the requested temp/reference tone with a richer top menu, search, category rail, footer, product cards, and multiple hero-slider iterations
- added a dedicated mobile hero slider with image-first ordering, top-mounted badge and chevrons, and mobile-sized typography and actions
- removed extra workspace and page hero chrome from the Home Slider route so the editor opens directly into the settings surface
- softened the storefront hero image frame toward a glass-like shell with blur and diffused spread instead of a hard border line
- split the main frontend entry into route-level chunks so production build no longer warns about the oversized initial bundle
- moved the storefront top category rail off a hardcoded frontend `All Products` item and onto backend-seeded `All Items` plus backend-controlled top-menu visibility
- extended the shared framework media picker so existing image fields can now use uploads, library assets, or direct external URLs from one flow
- improved shared core common-module image fields so list rows render a thumbnail preview and compact multi-line URL text instead of only the raw media path
- split storefront header concerns into dedicated top-menu and category-menu components, then added a centered sticky scrolled text-only category state with compact motion styling

### `#27` 2026-04-05

- added the app-owned `demo` application with protected internal routes, module-specific demo-data installers, live install progress, and summary/count pages for sample operational data
- introduced TanStack Query as the shared server-state layer and migrated storefront shell data, runtime app settings, branding, and demo installer polling onto it
- added Zustand only for lightweight shell/session and storefront coordination state without forcing a global reducer model across the repo
- improved storefront first paint with skeletons, eager hero media, lazy catalog/category/product images, and cleaner loading order on slower networks
- added a shared two-line toast system with runtime-configurable placement/tone, design-system docs coverage, and integration into admin save/install flows
- integrated a shared Tiptap editor with icon toolbar support and design-system docs coverage in the `ui` app
- moved storefront search, featured-card, and category-card surfaces into reusable shared `ui` blocks and shared UX components used by both docs and live ecommerce admin/front-end pages
- extended ecommerce storefront settings so featured and category sections have saved row counts, rows to show, card designers, toggles, and synced frontend rendering after save
- fixed storefront sync gaps so admin saves refresh the public storefront shell consistently, including announcement styling and featured/category layout updates
- tightened media-browser overflow so upload/filter controls remain visible while large media grids and edit dialogs scroll cleanly on smaller screens
