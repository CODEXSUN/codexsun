import { billingAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function BillingAppShell() {
  return (
    <AppWorkspacePreview
      manifest={billingAppManifest}
      accent="Financial operations"
      capabilities={[
        "Holds accounting, inventory, voucher, and reporting workflows.",
        "Stays isolated from ecommerce behavior and shared masters.",
        "Can grow desktop and offline paths without changing framework ownership.",
      ]}
    />
  )
}

export default BillingAppShell
