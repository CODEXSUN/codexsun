# QCafe: web POS

The web POS uses the existing Platform tenant session and tenant MariaDB. Desktop keeps its separate PIN and SQLite implementation.

## Workflow role

The first web workflow supports takeaway bills, partial and full payment collection, recent bills, and browser receipt printing. Prices come from the persisted menu. It does not add tax, discounts, dine-in tables, kitchen tickets, or refunds.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/qcafe/web/src/modules/pos/index.ts`
- `apps/qcafe/api/src/modules/pos/index.ts`
- Desktop only: `apps/qcafe/web/src/Pos1.tsx` and `apps/qcafe/api/src/store.mjs`.

## Explicit route declarations

- `GET /qcafe/pos`
- `POST /qcafe/pos`
- `POST /qcafe/pos/:uuid/payments`

## Tables created by this leaf

- `qcafe_pos`
- `qcafe_pos_lines`
- `qcafe_pos_payments`
- `qcafe_pos_activity`

## Permission declarations

- `qcafe.pos.view`
- `qcafe.pos.create`
- `qcafe.pos.pay`

Saved bills own immutable item snapshots and an append-only payment ledger. Payment writes lock the bill and reject overpayment. Request IDs deduplicate retries. All financial writes record their actor in the same transaction. The tenant database provides isolation.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
