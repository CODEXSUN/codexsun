## New Architecture Base

This folder starts the new parallel architecture base.

Top-level ownership:
- `framework/`: runtime, engines, shared library contracts, and manifest foundations
- `apps/`: business apps such as billing, CRM, and ecommerce
- `cxapp/`: orchestration, shell composition, and workspace resolution
- `industry/`: reusable industry packs
- `clients/`: client-specific overlays

This base is parallel to the current runtime structure. Do not move existing live code here in bulk. Migrate by small, owned slices.
