# Docs Web

## Purpose

Docs Web provides the browser reading, search, navigation, editing, and
documentation-health experience for the Docs application.

## Dependencies

It composes public `@codexsun/ui` layouts and components and consumes
versioned document data only through `@codexsun/docs-contracts` and the Docs
HTTP API.

## Configuration

Copy `.app.env.example` to the ignored `.app.env`. Configure `WEB_HOST` and
`WEB_PORT`; the root environment supplies `VITE_DOCS_API_URL`.

## Verification

Run `npm.cmd run typecheck --workspace @codexsun/docs-web`,
`npm.cmd run lint --workspace @codexsun/docs-web`, and
`npm.cmd run test --workspace @codexsun/docs-web`.
