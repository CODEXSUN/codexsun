# Zetro Web

The web host shows the standalone Zetro foundation status. Later tasks add
ideas, plans, tasks, reviews, workers, evidence, and approvals.

The web host consumes public Zetro API contracts and `@codexsun/ui` exports. It
does not run workers or access SQLite directly.

Set `PLATFORM_HOST`, `ZETRO_WEB_PORT`, and `VITE_ZETRO_API_URL` in
`web/.app.env`. Run `npm.cmd run test:zetro-web` and
`npm.cmd run check --workspace @codexsun/zetro-web`.
