# QCafe: restaurant menu

The web `menu` module owns tenant MariaDB menu items, their selling prices, category labels, activation status, and audit history.

## Workflow role

Web access uses Platform identity and live `qcafe.menu.view` or `qcafe.menu.manage` permission. Desktop masters remain on their existing SQLite and PIN contracts.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/qcafe/web/src/modules/menu/index.ts`
- `apps/qcafe/api/src/modules/menu/index.ts`
- Desktop only: `apps/qcafe/web/src/Masters.tsx` and `apps/qcafe/web/src/RestaurantTableMaster.tsx`.

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
