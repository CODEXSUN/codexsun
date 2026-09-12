# Eshop Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Eshop owns a static, responsive ecommerce landing page. It is a presentation-only
starting point for the future product and does not connect to an API, persistence,
authentication, checkout, or product-detail routes.

## Ownership

- `web` owns the landing-page composition, static catalogue data, and local UI feedback.
- `packages/ui` owns reusable controls, storefront blocks, layouts, and visual behavior.
- Eshop imports shared UI only through public `@codexsun/ui` exports and does not depend on UIUX.

## Workspaces and commands

| Workspace | Purpose | Development command | Default address |
| --- | --- | --- | --- |
| `@codexsun/eshop-web` | Static ecommerce landing page | `npm.cmd run dev --workspace @codexsun/eshop-web` | `http://127.0.0.1:6100` |

The page contains a header, hero, categories, featured products, promotion, and footer.
Its search, wishlist, and cart actions show local feedback only; they make no backend claim.

## Runtime configuration

`ESHOP_WEB_HOST` sets the local host and defaults to `127.0.0.1`.
`ESHOP_WEB_PORT` sets the local port and defaults to `6100`.
The application has no API URL, secret, or storage configuration.

## Health and shutdown

This static Vite workspace has no application health endpoint. Start and stop it
through its workspace command during local development. Runtime-holder registration
is deliberately deferred until Eshop has an approved deployable runtime plan.

## Verification

Run `npm.cmd run build --workspace @codexsun/eshop-web` and inspect the landing page
at desktop and mobile widths. Confirm the header search, cart, wishlist, category,
product, newsletter, and design-density interactions provide clear local feedback.

## Module catalog

Eshop has no business module in this initial static landing-page scope. A module catalog
entry and development record are required when an owned business capability is introduced.
