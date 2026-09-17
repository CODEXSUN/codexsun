# Orship API

The Orship API is a standalone Fastify host. It composes `platform.core` and
`orship.orchestration` through `@codexsun/platform-core`.

It listens on `ORSHIP_HOST` and `ORSHIP_API_PORT` from its ignored `.app.env`.
Start it with `npm.cmd run dev --workspace @codexsun/orship-api`.

Current routes:

- `GET /api/v1/orship/health`
- `GET /api/v1/orship/modules`
