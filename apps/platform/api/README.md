# Platform API

The Platform API composes generic Platform providers and module-owned routes.

Current modules:

- `platform.system` provides the health route.
- `platform.identity` provides signed JWT-protected actor reads and owns Identity data files.

The API requires `PLATFORM_JWT_SECRET`, `PLATFORM_JWT_ISSUER`, and
`PLATFORM_JWT_AUDIENCE` from the root environment. Do not place these values in
web-visible configuration or source code.

The Aaran profile also requires `PLATFORM_DEPLOYMENT_MODE=single`,
`PLATFORM_DEPLOYMENT_NAME`, and `PLATFORM_BOOTSTRAP_ADMIN_EMAIL`. The current
policy does not create a user account or issue a token.

See each module README before changing its routes, data, or public contracts.
