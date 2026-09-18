# Garments Web

## Purpose

Garments Web provides the browser reading, search, navigation, editing, and
documentation-health experience for the Garments application.

## Dependencies

It composes public `@codexsun/ui` layouts and components and consumes
versioned document data only through `@codexsun/garments-contracts` and the Garments
HTTP API.

## Configuration

Copy `.app.env.example` to the ignored `.app.env`. Configure `WEB_HOST` and
`WEB_PORT`; the root environment supplies `VITE_GARMENTS_API_URL`.

## Verification

Run `npm.cmd run typecheck --workspace @codexsun/garments-web`,
`npm.cmd run lint --workspace @codexsun/garments-web`, and
`npm.cmd run test --workspace @codexsun/garments-web`.
