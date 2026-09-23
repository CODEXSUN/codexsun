# Zetro Web

The web host shows the Zetro idea chat workspace. It supports persistent chat
history, local Codex runtime controls, streamed response trace, and temporary
file input.

The web host consumes public Zetro API contracts and `@codexsun/ui` exports. It
does not run workers, access SQLite directly, or persist device codes.

Set `PLATFORM_HOST`, `ZETRO_WEB_PORT`, and `VITE_ZETRO_API_URL` in
`web/.app.env`. Run `npm.cmd run test:zetro-web` and
`npm.cmd run check --workspace @codexsun/zetro-web`.
