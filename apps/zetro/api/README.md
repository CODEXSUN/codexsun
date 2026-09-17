# Zetro API

The API owns the `zetro.foundation` provider and Zetro runtime health contract.
It uses the shared Framework lifecycle and Platform Core runtime.

The API validates and checks `ZETRO_DATABASE_URL` and `ZETRO_DATABASE_PATH`.
It creates no Zetro workflow schema or migration.

Set `PLATFORM_HOST`, `ZETRO_API_PORT`, `ZETRO_DATABASE_URL`,
`ZETRO_DATABASE_PATH`, and `ZETRO_STORAGE_ROOT` in `api/.app.env`.

Run `npm.cmd run test:zetro-api` and `npm.cmd run check --workspace @codexsun/zetro-api`.
