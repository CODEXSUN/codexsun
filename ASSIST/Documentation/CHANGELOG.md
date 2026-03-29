# Changelog

## Version State

- Current package version: `0.0.1`
- Current release tag: `v-0.0.1`
- Reference format: `#<number>`

## v-0.0.1

### [#10] 2026-03-29 - ASSIST reconciliation and framework baseline layers

- reconciled ASSIST docs with the live `apps/` tree, current commands, and active shared UI state
- removed stale references to non-existent `githelper`, `version:bump`, and `Test/` workflows
- documented the current `cxapp` auth shell and `ui` design-system docs surface
- added a framework-owned machine-readable workspace and host baseline and exposed it through the internal API boundary
- started `Plan-4` with ordered framework database foundation sections and matching platform migration-section metadata
- implemented the first `Plan-5` HTTP slice with route manifest helpers, canonical `v1` internal and external routes, a public bootstrap route, and legacy path compatibility

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
