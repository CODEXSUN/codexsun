# Qcafe: Order

Owns POS orders, line snapshots, kitchen tickets, billing state, and revision-aware order operations.

## Ownership and access

Keep operations inside the owning module. The backend and host adapter resolve current authorization and database scope.
Client payloads and documentation do not grant access. Preserve validation, actor attribution, and revision checks.

## Source contracts

- `apps/qcafe/api/src/modules/order/index.ts`
- `apps/qcafe/api/src/modules/order/order.migration.ts`
- `apps/qcafe/api/src/modules/order/order.module.ts`
- `apps/qcafe/api/src/modules/order/order.repository.ts`
- `apps/qcafe/api/src/modules/order/order.routes.ts`
- `apps/qcafe/api/src/modules/order/order.seed.ts`
- `apps/qcafe/api/src/modules/order/order.service.ts`
- `apps/qcafe/api/src/modules/order/order.types.ts`
- `apps/qcafe/web/src/modules/order/index.ts`
- `apps/qcafe/web/src/modules/order/order.assignment.tsx`
- `apps/qcafe/web/src/modules/order/order.entry.tsx`
- `apps/qcafe/web/src/modules/order/order.form.tsx`
- `apps/qcafe/web/src/modules/order/order.hooks.ts`
- `apps/qcafe/web/src/modules/order/order.list.tsx`
- `apps/qcafe/web/src/modules/order/order.print.tsx`
- `apps/qcafe/web/src/modules/order/order.schema.ts`
- `apps/qcafe/web/src/modules/order/order.services.ts`
- `apps/qcafe/web/src/modules/order/order.types.ts`
- `apps/qcafe/web/src/modules/order/order.workspace.tsx`

## Declared routes

- `/qcafe/orders`
- `/qcafe/orders/:uuid`
- `/qcafe/orders/occupied-seats`

## Verification

Run owner typechecks, lint, module-boundary checks, and relevant tests.
Verify persisted behavior and denied access with an isolated development tenant before release.
Documented source presence is not evidence of remote delivery or production deployment.
