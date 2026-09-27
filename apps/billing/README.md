# Billing

This application owns its product modules and composition.

The current scope is foundation preparation only. Billing has a protected workspace shell, shared Platform local identity, a private SQLite identity database, and no business module yet.

## Ownership

Billing owns `apps/billing`. It uses the public `@codexsun/platform-core`, `@codexsun/framework`, and `@codexsun/ui` contracts. Business modules must be added under `apps/billing/api/src/modules/<module>` and `apps/billing/web/src/` only after the foundation checks remain green.

## Hosts

| Host        | Port | Health                                        |
| ----------- | ---: | --------------------------------------------- |
| Billing API | 6290 | `http://127.0.0.1:6290/api/v1/billing/health` |
| Billing web | 6291 | `http://127.0.0.1:6291`                       |

## Identity and storage

The API uses the shared Platform local identity contract. Development startup applies the identity migrations and seeds the configured super-admin, admin, and optional user accounts. Runtime identity data is stored at `storage/apps/billing/private/data/billing_db.sqlite`.

The protected `GET /api/v1/billing/workspace` route reports the foundation and authenticated actor roles. It is the composition point for the first Billing business module.

Run dependency installation only from the repository root. The app never owns a node_modules, dist, or .turbo directory.

## Verification

From the repository root:

```powershell
npm.cmd run check --workspace @codexsun/billing-api
npm.cmd run lint --workspace @codexsun/billing-api
npm.cmd run test --workspace @codexsun/billing-api
npm.cmd run check --workspace @codexsun/billing-web
npm.cmd run lint --workspace @codexsun/billing-web
npm.cmd run build --workspace @codexsun/billing-api
npm.cmd run build --workspace @codexsun/billing-web
node tools/check-root-layout.mjs
```
