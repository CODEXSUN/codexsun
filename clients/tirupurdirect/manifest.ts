import type { ClientManifest } from "../../apps/framework/manifests/client-manifest.js"

export const tirupurdirectClientManifest: ClientManifest = {
  id: "tirupurdirect",
  kind: "client",
  displayName: "Tirupur Direct Overlay",
  summary:
    "Garment D2C overlay for a brand-first tenant that keeps storefront, fulfilment, and lightweight CRM visible.",
  dependencies: [],
  industryId: "garment-ecommerce",
  enabledApps: [],
  disabledApps: [],
  enabledModuleIds: [],
  disabledModuleIds: ["billing.reports"],
  featureFlags: ["campaign-merchandising", "delivery-note-sales-handoff"],
}
