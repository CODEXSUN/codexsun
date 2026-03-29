import { apiAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function ApiAppShell() {
  return (
    <AppWorkspacePreview
      manifest={apiAppManifest}
      accent="Dual API surface"
      capabilities={[
        "Keeps internal routes isolated from external contracts.",
        "Acts as the route-only boundary for cross-app and third-party traffic.",
        "Stays transport-focused instead of absorbing domain logic.",
      ]}
    />
  )
}

export default ApiAppShell
