import { coreAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function CoreAppShell() {
  return (
    <AppWorkspacePreview
      manifest={coreAppManifest}
      accent="Shared business foundation"
      capabilities={[
        "Owns company, contact, and setup-level masters.",
        "Stays reusable across cxapp, billing, ecommerce, and integrations.",
        "Does not absorb unrelated app-specific workflows.",
      ]}
    />
  )
}

export default CoreAppShell
