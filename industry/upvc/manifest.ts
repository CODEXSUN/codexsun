import type { IndustryManifest } from "../../apps/framework/manifests/industry-manifest.js"

export const upvcIndustryManifest: IndustryManifest = {
  id: "upvc",
  kind: "industry",
  displayName: "UPVC",
  summary:
    "UPVC factory stock-focused bundle with inward, outward, transfer, and billing-linked inventory operations.",
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
    "billing.inventory",
    "stock.overview",
    "stock.inward",
    "stock.outward",
    "stock.operations",
  ],
  featureFlags: [],
}
