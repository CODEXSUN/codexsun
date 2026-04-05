import { ecommerceAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function EcommerceAppShell() {
  return (
    <AppWorkspacePreview
      manifest={ecommerceAppManifest}
      accent="Live storefront"
      capabilities={[
        "Owns the storefront journey from landing, catalog, and product detail through checkout and order tracking.",
        "Consumes shared products and contacts from core while keeping customer sessions, orders, and checkout behavior inside ecommerce.",
        "Ships a customer portal, Razorpay-ready payment flow, and app-owned storefront APIs without pushing commerce logic into framework or core.",
      ]}
    />
  )
}

export default EcommerceAppShell
