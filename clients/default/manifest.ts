import type { ClientManifest } from "../../apps/framework/manifests/client-manifest.js"

export const defaultClientManifest: ClientManifest = {
  id: "default",
  kind: "client",
  displayName: "Default Overlay",
  summary:
    "Default client overlay that keeps Codexsun tenant-aware without applying client-specific app or menu overrides.",
  dependencies: [],
  industryId: null,
  enabledApps: [],
  disabledApps: [],
  enabledModuleIds: [],
  disabledModuleIds: [],
  featureFlags: [],
}
