import { frappeAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function FrappeAppShell() {
  return (
    <AppWorkspacePreview
      manifest={frappeAppManifest}
      accent="Connector boundary"
      capabilities={[
        "Owns Frappe-specific contracts and synchronization logic.",
        "Stays isolated from billing and core domain ownership.",
        "Can expose connector dashboards without leaking runtime concerns.",
      ]}
    />
  )
}

export default FrappeAppShell
