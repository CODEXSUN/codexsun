# Sites API

The API exposes typed Zod routes, protected Sites Studio control-plane routes, public client content routes, and a protected internal OpenAPI reference.

## Control-plane modules

- `foundation` owns health and provider readiness.
- `content` owns editor-controlled published content, drafts, and revisions.
- `workspace` owns client workspace metadata, isolated environments, and deployment intent.

The workspace module stores only control-plane metadata. Client runtime data, databases, volumes, and secrets remain owned by the selected client environment.

## Verification

Run `npm run test --workspace @codexsun/sites-api` for API and module tests. The full API typecheck is currently also affected by pre-existing missing declarations for `@fastify/helmet` and `mysql2` in the repository dependency graph.
