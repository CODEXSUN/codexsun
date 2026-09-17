# Platform API

The Platform API composes generic Platform providers and module-owned routes.

Current modules:

- `platform.system` provides the health route.
- `platform.identity` provides signed JWT-protected actor reads and owns Identity data files.

The API requires `PLATFORM_JWT_SECRET` from the root environment. Run
`npm.cmd run platform:jwt-token` to create a local secret and a local operator
token. Do not place either value in web-visible configuration or source code.

The API uses the fixed Platform issuer and audience defaults. Do not set
`PLATFORM_JWT_ISSUER` or `PLATFORM_JWT_AUDIENCE` unless a reviewed protocol
change replaces those defaults.

Fastify registers Helmet and CORS for the configured `PLATFORM_WEB_ORIGIN`.
Use the local Platform web origin by default. Add a reviewed deployment-specific
origin instead of allowing every origin.

`GET /` redirects a ready API to `PLATFORM_WEB_ORIGIN`. Use `GET /healthz` for
a compact readiness check and `GET /api/v1/platform/health` for provider detail.

The Aaran profile also requires `PLATFORM_DEPLOYMENT_MODE=single`,
`PLATFORM_DEPLOYMENT_NAME`, and `PLATFORM_BOOTSTRAP_ADMIN_EMAIL`. The current
policy does not create a user account or issue a token.

See each module README before changing its routes, data, or public contracts.
