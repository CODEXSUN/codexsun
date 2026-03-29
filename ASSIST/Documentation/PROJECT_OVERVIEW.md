# Project Overview

## Mission

Build Codexsun as a reusable ERP platform with:

1. a reusable framework runtime
2. a main suite-facing app shell
3. isolated standalone app boundaries
4. explicit connector boundaries
5. one repository that scales without collapsing into one monolith

## Current Baseline

The repository currently runs with this model:

1. `apps/framework` is the reusable composition and runtime layer
2. `apps/cxapp` is the active product shell for both frontend and server entry wrappers
3. every app follows the same `src`, `web`, `database`, `helper`, and `shared` structure
4. `apps/api` owns split internal and external route definitions
5. `apps/ui` is the active shared design-system, auth-layout, and desk-shell surface
6. the `ui` app doubles as a routed design-system docs workspace with category browsing and component detail pages
7. active build outputs target `build/app/cxapp/web` and `build/app/cxapp/server`
8. MariaDB is the current live primary database target
9. SQLite is reserved for offline and future desktop paths
10. PostgreSQL remains an optional analytics path

## Suite Shape

Current app roots:

1. `framework`
2. `cxapp`
3. `core`
4. `api`
5. `site`
6. `ui`
7. `billing`
8. `ecommerce`
9. `task`
10. `frappe`
11. `tally`
12. `cli`

## Platform Principles

1. framework stays reusable beneath any one product shell
2. cxapp is the operator-facing suite interface, not the runtime owner
3. core stays shared and business-common
4. api ownership stays explicit and split by surface
5. ui stays shared and presentation-focused even when it powers auth, desk, and docs surfaces
6. apps stay isolated even when composed together
7. documentation and planning must track the real repository state

## Delivery Discipline

1. app builds go to `build/app/<app>/<target>`
2. future module builds go to `build/module/<module>/<target>`
3. versioning stays in lockstep semantic format
4. changelog and task references use one batch number per change set
