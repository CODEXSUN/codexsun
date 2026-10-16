# Notes: Notes

Owns tenant notes, their validation, persistence, HTTP operations, and workspace.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/notes/api/src/modules/notes/index.ts`
- `apps/notes/api/src/modules/notes/note.migration.ts`
- `apps/notes/api/src/modules/notes/note.module.ts`
- `apps/notes/api/src/modules/notes/note.repository.ts`
- `apps/notes/api/src/modules/notes/note.routes.ts`
- `apps/notes/api/src/modules/notes/note.seed.ts`
- `apps/notes/api/src/modules/notes/note.service.ts`
- `apps/notes/api/src/modules/notes/note.spec.ts`
- `apps/notes/api/src/modules/notes/note.types.ts`
- `apps/notes/web/src/modules/notes/index.ts`
- `apps/notes/web/src/modules/notes/note.form.tsx`
- `apps/notes/web/src/modules/notes/note.hooks.ts`
- `apps/notes/web/src/modules/notes/note.list.tsx`
- `apps/notes/web/src/modules/notes/note.schema.ts`
- `apps/notes/web/src/modules/notes/note.services.ts`
- `apps/notes/web/src/modules/notes/note.types.ts`
- `apps/notes/web/src/modules/notes/note.workspace.tsx`

## Declared routes

- `/notes/notes`
- `/notes/notes/:id`
- `/notes/notes/:id/restore`
- `/notes/notes/:id/suspend`

## Explicit permission checks

- `notes.manage`
