# Ecommerce

Ecommerce is a tenant owned app composed into the Platform API on port 7010. Its staff desk opens in Platform at `/app/ecommerce` on port 7020. The public storefront uses the same Ecommerce modules at `/shop` on port 7030.

## Run locally

Run commands from the repository root. Set `PLATFORM_API_PORT`, `PLATFORM_WEB_PORT`, `CODEXSUN_ECOMMERCE_WEB_PORT`, `CODEXSUN_UIUX_WEB_PORT`, and `CODEXSUN_PROJECT_MANAGER_WEB_PORT` in the root `.env`. The example uses ports 7010, 7020, 7030, 7040, and 7050.

```bash
npm install
npm run dev
```

`npm run dev:ecommerce` starts the public Ecommerce web app at `/shop`. Its other paths redirect to the Platform staff desk. `npm run dev:storefront` starts that same web app. It proxies `/api/platform` to the Platform API. Enable Ecommerce for the tenant through Plan Access before using either app.

## Modules

The staff desk owns product information, variants, images, catalog data sources, matching, sliders, promotions, featured cards, season strips, announcements, and the storefront profile. Core owns the underlying product, category, and brand records. Ecommerce reads those through its tenant database and keeps its own published storefront content. The staff UI is available from the Ecommerce menu in Platform.

The local brand strip uses Core Brand logos and storefront visibility. Edit those fields in Core Brands; Ecommerce reads the published brand display data without duplicating the brand record. The Core Brand migration adds these fields to existing tenant databases with visible defaults.

Frappe connection settings and credentials belong to the Frappe app. Configure and verify the tenant connection there. Ecommerce's Data Source page chooses Local or Frappe per catalog module; the choice stays in Ecommerce's tenant table. Live reads use the Frappe app connection and refresh the local cache when its last successful pull is over 15 minutes old. The storefront uses the cache during an outage and resumes live reads when Frappe recovers. Pull updates that cache immediately; Push sends the local catalog to Frappe. Ecommerce no longer saves or verifies credentials or seeds demo records into Frappe.
The current Platform activation contract requires CRM and Frappe to be enabled together for Frappe routes and migrations.

The public storefront reads published products and content through `/storefront/*` routes. It resolves the tenant from the verified request hostname and requires an active Ecommerce entitlement. The basket is local browser state; it does not submit orders, collect payment, or reserve stock. The Piko button has a product search fallback while the optional chat endpoint and panda sprite are unavailable.

The tenant migration installs the new Ecommerce tables, then drops the retired `ecommerce_catalog`, `ecommerce_catalog_activity`, and `ecommerce_storefront_*` quote/config/activity tables. Existing records in those retired tables are deleted. Core tables and records are not dropped. The migration ledger records each step for repeatable startup. The seed creates Ecommerce permissions and the default storefront profile.

Staff permissions are `ecommerce.catalog.view`, `ecommerce.catalog.edit`, `ecommerce.storefront.view`, and `ecommerce.storefront.manage`. Platform checks them before the staff routes run. Frappe catalog connection settings use the tenant's Frappe connection when that module is enabled.

The storefront still needs a verified tenant domain for public access outside the local development hostname. See the repository's tenant isolation and migration runbooks before applying the schema to an existing deployment.
