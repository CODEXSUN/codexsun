# CODEXSUN Billing Repository Inventory

## Purpose

This is the authoritative repository map for the composed Billing product. Historical changelog
entries may describe earlier layouts; they do not change the active stack.

Last reviewed: 2026-07-23.

## Active Repositories

| Repository  | Package               | Nature                                            | Runtime role                                   |
| ----------- | --------------------- | ------------------------------------------------- | ---------------------------------------------- |
| `codexsun`  | `codexsun`            | Executable Platform and composition root          | Platform API and Platform Web                  |
| `framework` | `@codexsun/framework` | Backend infrastructure and stable contracts       | Linked library; no business tables             |
| `ui`        | `@codexsun/ui`        | Presentation primitives                           | Linked library; no business ownership          |
| `sites`     | `@codexsun/sites`     | CMS, public-site, and application catalogue owner | Linked Platform dependency; no Billing service |
| `core`      | `@codexsun/core`      | Common, organisation, and master foundation       | API and Web packages composed into Platform    |
| `billing`   | `@codexsun/billing`   | Billing and financial documents                   | API and Web packages composed into Platform    |
| `mail`      | `@codexsun/mail`      | Mail delivery and synchronization                 | API and Web packages composed into Platform    |

Each directory is an independent Git repository with its own package metadata, lockfile, version,
changelog, checks, and release command. They are checked out as sibling folders under one parent.

## Composition

```text
framework -> core API -----+
sites ----> Platform API --+
          -> billing API --+
          -> mail API -----+--> codexsun Platform API

ui --------> core Web -----+
          -> billing Web --+
          -> mail Web -----+--> codexsun Platform Web
```

Imports cross a repository only through declared package exports, fixed HTTP contracts, or approved
events. Billing may use intentional public Core lookup/branding contracts and the public Mail
document-mail contract. Private source, repository, service, migration, seed, and table access is
prohibited.

## Database Ownership And Order

- Platform owns master and tenant-runtime tables under `src/platform/api/src/modules/`.
- Core owns tenant common, organisation, and master tables under `../core/api/src/modules/`.
- Billing owns tenant financial tables under `../billing/api/src/modules/`.
- Mail owns its tenant tables under `../mail/api/src/modules/mail/`.
- Framework and UI own no business tables.

The lifecycle order is Platform master, tenant runtime, Core, Billing, then Mail. Seeders follow the
same dependency order. Composition roots may call and order public lifecycle functions, but SQL,
seed records, parent resolution, and lifecycle policy remain in the owning leaf.

## Environment And Release Ownership

Only `codexsun` owns the executable Platform environment. Libraries validate or receive only the
values they consume and must not create competing runtime environments.

Every repository exposes `version:show`, `version:bump`, `check:versions`, and `github:now` as
standalone operations. Commit subjects use `#<two-or-more digits> - <message>`. The `codexsun`
lockfile records the exact composed compatibility baseline.

`codexsun/assist` is the canonical product-wide knowledge base. Each sibling keeps only its local
nature, ownership, lifecycle, changelog, and release rules.
