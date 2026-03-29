# Project Overview

## Mission

Build Codexsun as a reusable business software platform with:

1. a reusable framework
2. a shared business-common foundation
3. standalone application delivery
4. connector-ready integration boundaries
5. one repository that can scale across multiple products without losing control

## Platform Promise

The same platform should be able to deliver:

1. billing-only products
2. ERP-style combined suites
3. shopping cart and commerce products
4. CRM products
5. connector-led integrations for Frappe, Zoho, Tally, and future systems

## Current State

1. the repository now has a root npm workspace with implemented `framework`, `ui`, and `cli` packages
2. the active browser bootstrap runs from `apps/framework/src/main.tsx`
3. framework runtime environment, HTTP boundary contracts, multi-database configuration, platform-foundation database contracts, executable migration sections, and plugin contracts now live under `apps/framework/src`
4. the shared presentation layer now lives in `apps/ui` and is consumed by framework through the workspace package boundary
5. a shared build layout now exists at `build/app` for standalone apps and `build/module` for plugin modules
6. `apps/ui` now produces a redistribution-ready package artifact at `build/app/ui/package`
7. MariaDB is the current primary database target, with PostgreSQL and SQLite prepared at the framework config layer
8. `apps/cli` now owns githelper and version/release automation for the repository
9. `apps/docs` now holds module-facing Markdown documentation for shared packages and framework modules such as `apps/ui`, the platform database foundation, and the framework API boundary
10. shared app roots such as `core`, `billing`, `ecommerce`, and `task` are still planned but not scaffolded yet
11. Electron desktop runtime and backend composition roots still need their first implementation batch

## Platform Principles

1. framework must stay reusable outside any single application
2. core must provide only shared business-common capabilities
3. applications must stay standalone and shippable independently
4. connectors must be explicit and reviewable
5. hosts must compose apps through a DI/composition-root model instead of hidden cross-dependencies
6. documentation must explain the platform clearly enough for future contributors and client delivery teams
7. growth must not collapse into one uncontrolled monolith
8. platform-foundation database tables must be defined centrally before business-app tables branch out
9. new apps should begin as SaaS-first MVP slices so routing, data, and UX boundaries can stabilize before heavier deployment modes expand

## Target App Suite

1. `framework` provides runtime services and platform contracts
2. `core` provides shared business masters and reusable admin foundations
3. `ecommerce` provides commerce and storefront behavior
4. `billing` provides the separate accounts-and-inventory application base
5. `site` provides the static presentation surface
6. `ui` provides reusable UI and UX building blocks
7. `docs` provides unified platform and app documentation
8. `cli` provides server control commands and release automation
9. `orekso` provides the local-first support assistant runtime backed by Ollama and Qdrant
10. `task` provides enterprise task management and team workflows
11. `frappe` provides connector and plugin boundaries for Frappe integrations
12. `mcp` provides the Model Context Protocol server exposing Codexsun tools to AI agents

## Delivery Discipline

1. standalone apps must build to `build/app/<app>/<target>`
2. plugin or module packages must build to `build/module/<module>/<target>`
3. package versions stay in numeric lockstep semantic versioning
4. changelog versions and release tags use the `v-` prefix
5. every meaningful batch uses one reference number across task tracking, planning, changelog entries, and commit subjects
6. shared presentation code must ship from `apps/ui`, not from framework or business-app folders
