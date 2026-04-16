## Rollout Guide

### Purpose

Use this guide when adding new code into the new parallel architecture base.

### Dependency Direction

Allowed direction:

`clients -> industry -> apps -> framework`

Additional rule:

- `cxapp` may orchestrate apps, industries, and clients
- `framework` must not depend on `apps`, `industry`, or `clients`
- `apps` must not depend directly on `clients`
- `industry` must not depend on `clients`

### Folder Entry Rules

Put new code in:

- `framework/runtime`
  - config, database runtime, HTTP runtime, auth primitives, host lifecycle
- `framework/engines`
  - reusable business-capability engines shared across more than one app or industry
- `framework/lib`
  - low-level shared contracts, helper types, and platform-safe utilities
- `apps/<app>`
  - app-owned workflows, app-owned backend modules, app-owned frontend
- `cxapp`
  - orchestration, workspace composition, app registration, visibility, shell routing
- `industry/<pack>`
  - reusable industry defaults, workflow presets, enablement rules
- `clients/<client>`
  - branding, client-specific enablement, client defaults, report or config overlays

Do not put new code in:

- `framework` when the concern is app-specific business logic
- `cxapp` when the concern belongs to billing, CRM, ecommerce, or another app
- `industry` when the concern is reusable across industries
- `clients` when the concern is reusable across multiple clients

### First Migration Rule

Do not rewrite the current repository in one batch.

Use this sequence:

1. add the new structure
2. add contracts and manifests
3. move one bounded capability at a time
4. keep old and new paths explicit during transition
5. remove old ownership only after the replacement is working

### First Recommended Migration Slice

The first serious engine candidate should be stock.

Reason:

- stock already spans billing, core, ecommerce, and connector boundaries
- stock requires reusable rules for movement, reservation, identity, and availability
- industry packs should configure stock behavior, not replace the stock core

Recommended first stock split:

1. `framework/engines/inventory-engine`
   - movement ledger
   - warehouse topology
   - stock identity
   - reservation and allocation rules
   - availability projection
2. `apps/billing`
   - purchase, inward, accounting, valuation posting
3. `apps/ecommerce`
   - reservation consumption, fulfilment, delivery, return-facing state
4. `cxapp`
   - stock workspace composition and cross-app navigation only

### Manifest Rule

Every new engine, app, industry pack, or client overlay should add a manifest using:

- `framework/manifests/engine-manifest.ts`
- `framework/manifests/app-manifest.ts`
- `framework/manifests/industry-manifest.ts`
- `framework/manifests/client-manifest.ts`

Keep manifests small at first:

- identity
- display name
- summary
- dependencies

### Stock Readiness Note

Before live stock migration starts, define:

- warehouse, rack, and bin topology
- stock movement event types
- reservation states
- location transfer rules
- tenant-safe stock ownership

This should be the next architecture batch after this base scaffold.
