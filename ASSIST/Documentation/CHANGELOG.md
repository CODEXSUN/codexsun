# Changelog

## Version State

- Current package version: `0.0.1`
- Current release tag: `v-0.0.1`
- Reference format: `#<number>`

## v-0.0.1

### [#9] 2026-03-29 - CxApp isolated workspace baseline

- promoted `apps/cxapp` into the active frontend and server wrapper while keeping framework reusable underneath
- normalized every app to `src`, `web`, `database`, `helper`, and `shared`
- added workspace metadata to manifests and root tests for structure validation
- constrained the active shared UI package to the real design-system surface

### [#8] 2026-03-29 - Framework-first suite scaffolds and API split

- made `apps/framework` the active reusable runtime and composition root
- added DI-based app registration, app-suite manifests, and internal/external API route partitioning
- scaffolded standalone app roots for `core`, `api`, `site`, `billing`, `ecommerce`, `task`, `frappe`, `tally`, and `cli`
- expanded the framework runtime for MariaDB-first configuration, optional offline SQLite, and future analytics PostgreSQL

### [#1] 2026-03-29 - Repository initialization

- initialized the repository and the first ASSIST documentation baseline
