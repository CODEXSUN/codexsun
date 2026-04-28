import type { ClientManifest } from "../../apps/framework/manifests/client-manifest.js"

export const upvcPrimeClientManifest: ClientManifest = {
  id: "upvcprime",
  kind: "client",
  displayName: "UPVC Prime Overlay",
  summary:
    "UPVC manufacturing overlay that adds CRM visibility for project coordination beside stock and billing operations.",
  dependencies: [],
  industryId: "upvc",
  enabledApps: ["crm"],
  disabledApps: [],
  enabledModuleIds: ["crm.overview", "crm.sales"],
  disabledModuleIds: [],
  featureFlags: ["project-wise-dispatch"],
}
