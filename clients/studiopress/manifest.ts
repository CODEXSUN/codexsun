import type { ClientManifest } from "../../apps/framework/manifests/client-manifest.js"

export const studioPressClientManifest: ClientManifest = {
  id: "studiopress",
  kind: "client",
  displayName: "Studio Press Overlay",
  summary:
    "Offset-print overlay that keeps the billing desk compact and trims stock-facing workspace groups from the operator shell.",
  dependencies: [],
  industryId: "offset",
  enabledApps: [],
  disabledApps: [],
  enabledModuleIds: [],
  disabledModuleIds: ["core.common"],
  featureFlags: ["job-ticket-billing"],
}
