# Project Overview

## Mission

Build Codexsun as a reusable ERP platform with:

1. a reusable framework runtime
2. a main suite-facing app shell
3. isolated standalone app boundaries
4. explicit connector boundaries
5. one repository that scales without collapsing into one monolith
6. a future path toward plugin-first engines, reusable industry packs, client overlays, and Codexsun-operated multi-client orchestration

## Current Baseline

The repository currently runs with this model:

1. `apps/framework` is the reusable composition and runtime layer
2. `apps/cxapp` is the active product shell for both frontend and server entry wrappers
3. every framework-composed suite app follows the same `src`, `web`, `database`, `helper`, and `shared` structure
4. `apps/api` owns split internal and external route definitions
5. `apps/ui` is the active shared design-system, auth-layout, and desk-shell surface
6. the `ui` app doubles as a routed design-system docs workspace with category browsing and component detail pages
7. `apps/ecommerce` is a live storefront app that reads shared masters from `core` and owns customer commerce flows end to end
8. `apps/demo` and `apps/crm` are live suite apps with app-owned workspace surfaces
9. `apps/mobile` is a companion Expo client package outside the framework-composed suite
10. active build outputs target `build/app/cxapp/web` and `build/app/cxapp/server`
11. MariaDB is the current live primary database target
12. PostgreSQL remains available for approved runtime deployments and optional analytics paths
13. local and container startup must use managed network database services
14. `cxmedia/` is a root-level standalone service for self-hosted media storage, CDN-style image delivery, signed URLs, and file-manager operations outside the main suite shell
15. the first live tenant-visibility layer already resolves industry bundles, client overlays, and tenant-specific app or module visibility inside the shared cxapp shell

Architecture maturity note:

1. the repo is moving toward a modular monolith, but does not yet fully meet strong modular-monolith criteria
2. DDD is an approved target, but it is not yet the dominant structure across the current apps
3. event-driven design is also an approved target, but current runtime flows are still primarily direct composition and direct-call based
4. hexagonal backend structure is also an approved target, but it should be introduced pragmatically through ports and adapters where complexity justifies it rather than through repo-wide ceremony

## Workspace Shape

Current app roots:

1. `framework`
2. `cxapp`
3. `core`
4. `api`
5. `site`
6. `ui`
7. `billing`
8. `ecommerce`
9. `demo`
10. `task`
11. `crm`
12. `frappe`
13. `tally`
14. `cli`
15. `mobile`

Current root-level standalone service roots:

1. `cxmedia`

## Platform Principles

1. framework stays reusable beneath any one product shell
2. cxapp is the operator-facing suite interface, not the runtime owner
3. core stays shared and master-data focused
4. api ownership stays explicit and split by surface
5. ui stays shared and presentation-focused even when it powers auth, desk, and docs surfaces
6. apps stay isolated even when composed together
7. companion clients such as `apps/mobile` must be documented explicitly instead of being forced into the suite-app shape
8. documentation and planning must track the real repository state
9. architecture evolution must happen in safe staged refactors that keep working legacy paths alive while boundaries are improved
10. DDD is applied first in stable bounded contexts, not as blanket folder ceremony
11. event-driven behavior begins with typed in-process events and grows into durable delivery only where the operational need is real
12. hexagonal structure is applied pragmatically: boundary hardening and public contracts come first, while ports, adapters, repositories, and richer domain modeling are added where they reduce coupling and review risk

## Long-Term Direction

The approved future direction is:

1. keep the current repository working while planning a move toward engines, shared packages, standalone apps, industry packs, client overlays, and orchestration surfaces
2. keep all app communication flowing through API, framework, core, UI, or explicit shared contracts instead of direct cross-app coupling
3. support many clients and industries from one platform through feature enablement, workspace resolution, and client overlays rather than repeated forks
4. evolve Codexsun itself into the internal control plane for deployment, monitoring, support, maintenance, and cross-client operations

Near-to-mid-term transition order:

1. strengthen modular-monolith boundaries first
2. introduce application-domain-infrastructure separation and ports-and-adapters where complexity justifies them
3. introduce DDD incrementally inside one stable domain at a time
4. introduce event-driven cross-module reactions in-process first, then make them durable only where justified
5. keep expanding tenant-aware bundle, overlay, and menu visibility resolution from the current shared desk baseline instead of forking client shells

Pragmatic adoption rule:

1. mandatory first: explicit ownership, thin transport, public module contracts, and reduced cross-app private imports
2. introduce when complexity exists: application services, ports, adapters, repositories, and frontend feature folders
3. introduce only in stable, complex domains: aggregates, value objects, domain events, command-query splits, and richer event handler flows
4. do not create target-state folders everywhere just because the blueprint mentions them; create them only when the use case needs them

The detailed target model is defined in [MODULAR_ERP_BLUEPRINT.md](/E:/Workspace/codexsun/ASSIST/Documentation/MODULAR_ERP_BLUEPRINT.md).
The planned workspace, permission, and feature-resolution follow-up contracts are defined in:

1. [WORKSPACE_VISIBILITY_MATRIX.md](/E:/Workspace/codexsun/ASSIST/Documentation/WORKSPACE_VISIBILITY_MATRIX.md)
2. [PERMISSION_MATRIX.md](/E:/Workspace/codexsun/ASSIST/Documentation/PERMISSION_MATRIX.md)
3. [FEATURE_FLAG_POLICY.md](/E:/Workspace/codexsun/ASSIST/Documentation/FEATURE_FLAG_POLICY.md)
4. [VISIBILITY_LEDGER_DESIGN.md](/E:/Workspace/codexsun/ASSIST/Documentation/VISIBILITY_LEDGER_DESIGN.md)

The planned stock and warehouse operating flow is defined in:

1. [STOCK_WAREHOUSE_DELIVERY_BLUEPRINT.md](/E:/Workspace/codexsun/ASSIST/Documentation/STOCK_WAREHOUSE_DELIVERY_BLUEPRINT.md)

The runtime now covers local billing purchase receipt and goods inward documents, verified inward posting into stock-owned live balance, stock-unit identity with batch or serial and internal barcode mappings, sticker-print payload generation, and scan-based sales allocation records. Warehouse UI, putaway, and delivery workspace flows remain later phases.

## Delivery Discipline

1. app builds go to `build/app/<app>/<target>`
2. future module builds go to `build/module/<module>/<target>`
3. versioning stays in lockstep semantic format
4. changelog and task references use one batch number per change set
