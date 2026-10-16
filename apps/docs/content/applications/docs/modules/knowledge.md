# Docs: Knowledge

This page records the `knowledge` module in the Docs owner. The application business context is: developer documentation authored in git with tenant-owned metadata and markdown overrides.

## Workflow role

Docs owns developer reference metadata, overrides and audit. Assist governance remains authoritative for coding rules; documentation does not grant runtime access.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/docs/api/src/modules/knowledge/index.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.content.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.migration.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.module.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.repository.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.routes.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.seed.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.service.ts`
- `apps/docs/api/src/modules/knowledge/knowledge.types.ts`
- `apps/docs/web/src/modules/knowledge/index.ts`
- `apps/docs/web/src/modules/knowledge/knowledge.form.tsx`
- `apps/docs/web/src/modules/knowledge/knowledge.hooks.ts`
- `apps/docs/web/src/modules/knowledge/knowledge.list.tsx`
- `apps/docs/web/src/modules/knowledge/knowledge.renderer.tsx`
- `apps/docs/web/src/modules/knowledge/knowledge.schema.ts`
- `apps/docs/web/src/modules/knowledge/knowledge.services.ts`
- `apps/docs/web/src/modules/knowledge/knowledge.types.ts`
- `apps/docs/web/src/modules/knowledge/knowledge.workspace.tsx`

## Explicit route declarations

- `/app/docs/library?page=${encodeURIComponent(p.pageKey)}`
- `/app/docs/library?page=${encodeURIComponent(s.pageKey)}`
- `/docs/knowledge`
- `/docs/knowledge/:uuid`

## Tables created by this leaf

- `docs_knowledge_activity`
- `docs_knowledge_pages`

## Permission declarations

- `docs.knowledge.edit`
- `docs.knowledge.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
