# Orship API

The API exposes typed Zod routes and a protected internal OpenAPI reference.

Deployment routes are under `/api/v1/orship/deployment`. They require an
authenticated Orship actor and module permissions such as
`deployments.create`, `deployments.rollback`, `targets.manage`, and
`logs.read`. Provider and deployment failures are mapped to Orship errors and
audited with the actor, operation, target, application, result, and correlation
ID.

Set `DATABASE_URL` to MariaDB before enabling deployment routes. Set
`ORSHIP_DOKPLOY_BASE_URL` and `ORSHIP_DOKPLOY_ACCESS_TOKEN_REF` to register a
Dokploy provider. The token reference is resolved by the existing secret
provider; only the reference is persisted. Use the local Dokploy container for
integration tests when Docker is available. External provider tests are skipped
when their environment is absent.
