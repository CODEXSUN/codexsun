import type { ClientManifest } from "../../apps/framework/manifests/client-manifest.js"

export const theTirupurTextilesClientManifest: ClientManifest = {
  id: "thetirupurtextiles",
  kind: "client",
  displayName: "The Tirupur Textiles Overlay",
  summary:
    "Garment factory overlay that expands the stock-led garments bundle with CRM follow-up and customer coordination.",
  dependencies: [],
  industryId: "garments",
  enabledApps: ["crm"],
  disabledApps: [],
  enabledModuleIds: ["crm.overview", "crm.sales"],
  disabledModuleIds: [],
  featureFlags: ["production-merchandiser-desk"],
}
