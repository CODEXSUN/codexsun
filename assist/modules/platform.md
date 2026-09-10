# Platform Module Catalog

## Application ownership

Platform is the technical composition host. Its API and web workspaces are documented in [apps/platform](../../apps/platform/README.md).

## Modules

The Module Runtime owns durable lifecycle metadata and module-owned data execution. Identity owns portal authentication and authorization. The System module exposes versioned runtime discovery and structured diagnostics.

| Module ID        | Version                   | Scope      | Status | Backend README                                                                     | Frontend README                                                        |
| ---------------- | ------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `module-runtime` | `1.1.0`                   | `platform` | Active | [Module Runtime API](../../apps/platform/api/src/modules/module-runtime/README.md) | None                                                                   |
| `identity`       | `1.2.0` API / `1.1.0` web | `platform` | Active | [Identity API](../../apps/platform/api/src/modules/identity/README.md)             | [Identity web](../../apps/platform/web/src/modules/identity/README.md) |
| `system`         | `1.1.0`                   | `platform` | Active | [System API](../../apps/platform/api/src/modules/system/README.md)                 | [System web](../../apps/platform/web/src/modules/system/README.md)     |
