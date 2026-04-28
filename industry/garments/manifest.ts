import type { IndustryManifest } from "../../apps/framework/manifests/industry-manifest.js"

export const garmentsIndustryManifest: IndustryManifest = {
  id: "garments",
  kind: "industry",
  displayName: "Garments",
  summary:
    "Factory-oriented garment operations bundle covering billing, accounts, stock, and shared masters without ecommerce by default.",
  dependencies: [
    { id: "billing", kind: "app" },
    { id: "stock", kind: "app" },
    { id: "core", kind: "app" },
  ],
  enabledApps: ["core", "billing", "stock"],
  enabledModuleIds: [
    "core.overview",
    "core.master",
    "core.common",
    "billing.overview",
    "billing.system",
    "billing.books",
    "billing.vouchers",
    "billing.accounts",
    "billing.inventory",
    "billing.reports",
    "stock.overview",
    "stock.inward",
    "stock.outward",
    "stock.operations",
  ],
  featureFlags: [],
}
