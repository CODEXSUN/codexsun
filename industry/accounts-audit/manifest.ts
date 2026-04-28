import type { IndustryManifest } from "../../apps/framework/manifests/industry-manifest.js"

export const accountsAuditIndustryManifest: IndustryManifest = {
  id: "accounts-audit",
  kind: "industry",
  displayName: "Accounts Audit",
  summary:
    "Accounts-and-audit bundle focused on ledgers, vouchers, statements, tax review, and shared business masters.",
  dependencies: [
    { id: "billing", kind: "app" },
    { id: "core", kind: "app" },
  ],
  enabledApps: ["core", "billing"],
  enabledModuleIds: [
    "core.overview",
    "core.master",
    "core.common",
    "billing.overview",
    "billing.system",
    "billing.books",
    "billing.vouchers",
    "billing.accounts",
    "billing.reports",
  ],
  featureFlags: [],
}
