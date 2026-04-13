import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function EcommercePurchaseReceiptFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="ecommerce"
      sectionId="stock-purchase-receipts-upsert"
      purchaseReceiptId={params.purchaseReceiptId}
    />
  )
}
