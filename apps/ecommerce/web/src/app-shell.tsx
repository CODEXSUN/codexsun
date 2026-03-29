import { ecommerceAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function EcommerceAppShell() {
  return (
    <AppWorkspacePreview
      manifest={ecommerceAppManifest}
      accent="Commerce engine"
      capabilities={[
        "Owns catalog, storefront, checkout, and customer flows.",
        "Keeps commerce delivery separate from billing and connector concerns.",
        "Can expose dedicated web experiences without breaking suite boundaries.",
      ]}
    />
  )
}

export default EcommerceAppShell
