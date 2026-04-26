import type { IndustryManifest } from "../../apps/framework/manifests/industry-manifest.js"

export const textileWholesaleIndustryManifest: IndustryManifest = {
  id: "textile-wholesale",
  kind: "industry",
  displayName: "Textile Wholesale",
  summary:
    "Industry pack for textile trading, warehousing, procurement, and wholesale-oriented stock flows.",
  dependencies: [
    { id: "inventory-engine", kind: "engine" },
    { id: "billing", kind: "app" },
    { id: "crm", kind: "app", optional: true },
  ],
  enabledApps: ["billing", "crm"],
}
