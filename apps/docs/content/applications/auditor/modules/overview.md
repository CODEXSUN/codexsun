# Auditor: Overview

This page records the `overview` module in the Auditor owner. The application business context is: client portal access and audit-oriented client workspace.

## Workflow role

Auditor owns client portal/credential fields. Its overview does not imply a complete statutory audit platform.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/auditor/web/src/modules/overview/index.ts`
- `apps/auditor/web/src/modules/overview/overview.workspace.tsx`

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
