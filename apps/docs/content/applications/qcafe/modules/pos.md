# Q Cafe: Pos

This page records the `pos` module in the Q Cafe owner. The application business context is: restaurant/pos operations with its own pin login and desktop delivery.

## Workflow role

Q Cafe has its own runtime, login and deployment contract. Do not reuse its PIN identity as Platform tenant authentication.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/qcafe/web/src/Pos1.tsx`
- `apps/qcafe/api/src/store.mjs`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

- `migrations`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
