# Core

## Component documentation

Shared tenant masters, contact and product identity, organization records, and geographic relationships.

A concrete leaf owns its schema, repository, validation, routes, seeds, and UI. Other apps use public lookup contracts rather than private Core implementations.

The public `getOrganisationOptionsForDatabase` contract supplies active company and financial-year options plus the tenant Default Company. Ecommerce uses this read contract for its own storefront organisation settings. It does not change Core defaults.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `common`, `common/accounts/ledger-groups`, `common/accounts/ledgers`, `common/contacts/address-types`, `common/contacts/bank-names`, `common/contacts/contact-groups`, `common/contacts/contact-types`, `common/location`, `common/location/city`, `common/location/country`, `common/location/district`, `common/location/pincode`, `common/location/state`, `common/others/currencies`, `common/others/months`, `common/others/payment-terms`, `common/others/priorities`, `common/others/sales-types`, `common/products/brands`, `common/products/colours`, `common/products/hsn-codes`, `common/products/product-categories`, `common/products/product-groups`, `common/products/product-types`, `common/products/sizes`, `common/products/styles`, `common/products/taxes`, `common/products/units`, `common/workorder/destinations`, `common/workorder/stock-rejection-types`, `common/workorder/transports`, `common/workorder/warehouses`, `common/workorder/work-order-types`, `master`, `master/contact`, `master/product`, `master/work-order`, `organisation`, `organisation/company`, `organisation/default-company`, `organisation/financial-year`.
- `web/src/modules`: `common/accounts/ledger-groups`, `common/accounts/ledgers`, `common/contacts/address-types`, `common/contacts/bank-names`, `common/contacts/contact-groups`, `common/contacts/contact-types`, `common/location/city`, `common/location/country`, `common/location/district`, `common/location/pincode`, `common/location/state`, `common/others/currencies`, `common/others/months`, `common/others/payment-terms`, `common/others/priorities`, `common/others/sales-types`, `common/products/brands`, `common/products/colours`, `common/products/hsn-codes`, `common/products/product-categories`, `common/products/product-groups`, `common/products/product-types`, `common/products/sizes`, `common/products/styles`, `common/products/taxes`, `common/products/units`, `common/workorder/destinations`, `common/workorder/stock-rejection-types`, `common/workorder/transports`, `common/workorder/warehouses`, `common/workorder/work-order-types`, `master/contact`, `master/product`, `master/work-order`, `organisation/company`, `organisation/default-company`, `organisation/financial-year`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs core`
- `npm run typecheck -w @codexsun/core-api`
- `npm run lint -w @codexsun/core-api`
- `npm run build -w @codexsun/core-api`
- `npm run typecheck -w @codexsun/core-web`
- `npm run lint -w @codexsun/core-web`
- `npm run build -w @codexsun/core-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/core-api`.
- `web`: `@codexsun/core-web`.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/core-api`: `.`.
- `@codexsun/core-web`: `.`, `./modules/common/*`, `./modules/master`, `./modules/master/*`, `./modules/master/contact/workspace`, `./modules/organisation`, `./modules/organisation/*`, `./modules/organisation/company/branding`, `./modules/organisation/company/services`, `./modules/organisation/default-company/hooks`, `./modules/organisation/default-company/services`, `./modules/organisation/default-company/types`, `./modules/organisation/financial-year/services`.
