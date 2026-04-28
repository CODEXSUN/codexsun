import type { ClientManifest } from "../../apps/framework/manifests/client-manifest.js"

export const auditDeskClientManifest: ClientManifest = {
  id: "auditdesk",
  kind: "client",
  displayName: "Audit Desk Overlay",
  summary:
    "Accounts-and-audit overlay that keeps the suite finance-led and removes broad master-data maintenance from daily operator navigation.",
  dependencies: [],
  industryId: "accounts-audit",
  enabledApps: [],
  disabledApps: [],
  enabledModuleIds: [],
  disabledModuleIds: ["core.common"],
  featureFlags: ["audit-review-mode", "voucher-review-queue"],
}
