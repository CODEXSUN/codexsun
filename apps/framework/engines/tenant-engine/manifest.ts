import type { EngineManifest } from "../../manifests/engine-manifest.js"

export const tenantEngineManifest: EngineManifest = {
  id: "tenant-engine",
  kind: "engine",
  displayName: "Tenant Engine",
  summary:
    "Reusable tenant, company-link, and industry-profile foundation for multi-tenant development and single-tenant production deployment.",
  dependencies: [],
}
