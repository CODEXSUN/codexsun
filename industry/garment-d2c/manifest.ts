import type { IndustryManifest } from "../../apps/framework/manifests/industry-manifest.js"

export const garmentD2cIndustryManifest: IndustryManifest = {
  id: "garment-d2c",
  kind: "industry",
  displayName: "Garment D2C",
  summary:
    "Industry pack for garment direct-to-consumer operations spanning commerce, billing, and stock-aware fulfilment.",
  dependencies: [
    { id: "inventory-engine", kind: "engine" },
    { id: "billing", kind: "app" },
    { id: "ecommerce", kind: "app" },
    { id: "crm", kind: "app", optional: true },
  ],
  enabledApps: ["billing", "ecommerce", "crm"],
}
