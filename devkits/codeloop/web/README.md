# CodeLoop Web

The web host composes the shared MDI workspace and proxies `/api` requests to the CodeLoop API during local development. Vite cache files write to `dist/.vite/devkits/codeloop/web` and production output writes to `dist/devkits/codeloop/web`.

## Configuration

Copy `.app.env.example` to `.app.env` for local development. Do not commit the copied file.

## Verification

Run `npm.cmd run check --workspace @codexsun/codeloop-web`, `npm.cmd run lint --workspace @codexsun/codeloop-web`, and `npm.cmd run build --workspace @codexsun/codeloop-web` from the repository root.
