# Billing Web

The web host composes the shared MDI workspace and shared identity boundary. Vite cache files write to `dist/.vite/apps/billing/web`.

The current user desk is foundation-only. It reads the protected Billing workspace contract and exposes identity-management and privileged desks through the shared `SessionBoundary`; no Billing business module is registered yet.

Run `npm.cmd run check --workspace @codexsun/billing-web`, `npm.cmd run lint --workspace @codexsun/billing-web`, and `npm.cmd run build --workspace @codexsun/billing-web` from the repository root.
