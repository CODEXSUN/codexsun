# Environment Contract

## Ownership

The executable `codexsun` repository owns the Platform runtime `.env` and `.env.example`.
Framework owns only the environment loader. Core and Billing validate the server-side subset they
consume. Mail receives runtime dependencies through Platform composition.

Framework, UI, Core, Billing, and Mail must not create competing Platform `.env` files.

## Runtime Groups

- Runtime: `NODE_ENV`, Platform API/Web ports, public URL/origin, allowed origins, and the optional internal Web health URL.
- Database: driver, host, port, user, password, master name, and guarded lifecycle controls.
- Queue: backend, Redis URL, worker enablement/interval, and retention.
- Storage: root, public root, private root, backup, and restore controls.
- Mail fallback: SMTP and sender values; tenant company settings take priority.
- Tenant test seed: disabled by default; all required tenant values are validated when enabled.
- Authentication: JWT secret, auth mode, and optional intentionally seeded users.
- Billing integration: server-only GSP environment and credentials.
- Tooling: local restored-dump, backup verification, dev port, and database client/admin controls.

## Rules

- Never commit `.env` or real credentials.
- `.env.example` contains every supported operator-facing key with non-secret examples.
- Startup Zod schemas validate all runtime values consumed by an application.
- Frontend code never receives database, JWT, SMTP, GSP, or administrative secrets.
- Tenant-specific database secrets use the tenant's configured secret-reference key with the
  composing database password only as the documented fallback.
- Production reset, restore, and migration operations require explicit confirmation variables.
- Lower-environment copies of production data must be masked.

## Resolution

`@codexsun/framework/env` searches from the current working directory toward the nearest executable
npm-workspace root and loads that root's `.env`. Therefore composed Core and Billing code reads the
Platform environment without maintaining duplicate files.

## Maintenance

When adding or removing a variable:

1. Update the owning Zod schema.
2. Update `codexsun/.env.example`.
3. Update this contract and the closest operational runbook.
4. Verify no secret is exposed as a frontend/Vite variable.
5. Run typecheck, build, and the affected runtime or database check.
