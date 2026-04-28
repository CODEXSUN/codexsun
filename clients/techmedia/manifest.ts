import type { ClientManifest } from "../../apps/framework/manifests/client-manifest.js"

export const techmediaClientManifest: ClientManifest = {
  id: "techmedia",
  kind: "client",
  displayName: "Techmedia Overlay",
  summary:
    "Computer-store retail overlay that keeps billing, stock, and storefront active while exposing ERP connector controls.",
  dependencies: [],
  industryId: "computer-store-ecommerce",
  enabledApps: ["frappe"],
  disabledApps: [],
  enabledModuleIds: ["frappe.connector", "frappe.workspace"],
  disabledModuleIds: [],
  featureFlags: ["erp-sync", "serial-stock-sales"],
}
