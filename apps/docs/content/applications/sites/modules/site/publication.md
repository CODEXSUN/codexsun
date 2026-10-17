# Sites: Site / Publication

Exports a validated, checksummed snapshot of published site pages and blogs. The site must be active and content must be published.

## Ownership and access

Keep operations inside the owning module. The backend and host adapter resolve current authorization and database scope.
Client payloads and documentation do not grant access. Preserve validation, actor attribution, and revision checks.

## Source contracts

- `apps/sites/api/src/modules/site/publication/index.ts`
- `apps/sites/api/src/modules/site/publication/publication.integrity.ts`
- `apps/sites/api/src/modules/site/publication/publication.migration.ts`
- `apps/sites/api/src/modules/site/publication/publication.module.ts`
- `apps/sites/api/src/modules/site/publication/publication.repository.ts`
- `apps/sites/api/src/modules/site/publication/publication.routes.ts`
- `apps/sites/api/src/modules/site/publication/publication.schema.ts`
- `apps/sites/api/src/modules/site/publication/publication.service.ts`
- `apps/sites/api/src/modules/site/publication/publication.test.ts`
- `apps/sites/api/src/modules/site/publication/publication.types.ts`

## Declared routes

- `/sites/:uuid/publication/export`
- `/sites/c0de0004/publication/export`

## Verification

Run owner typechecks, lint, module-boundary checks, and relevant tests.
Verify persisted behavior and denied access with an isolated development tenant before release.
Documented source presence is not evidence of remote delivery or production deployment.
