import type { IndustryManifest } from "../../apps/framework/manifests/industry-manifest.js"

export const offsetIndustryManifest: IndustryManifest = {
  id: "offset",
  kind: "industry",
  displayName: "Offset",
  summary:
    "Mini billing-first offset printing bundle with customer, item, invoice, receipt, and basic accounts visibility.",
  dependencies: [
    { id: "billing", kind: "app" },
    { id: "core", kind: "app" },
  ],
  enabledApps: ["core", "billing"],
  enabledModuleIds: [
    "core.overview",
    "core.master",
    "billing.overview",
    "billing.system",
    "billing.books",
    "billing.vouchers",
    "billing.accounts",
  ],
  featureFlags: [],
}
