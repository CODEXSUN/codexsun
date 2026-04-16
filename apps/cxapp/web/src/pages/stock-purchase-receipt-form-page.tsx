import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockPurchaseReceiptFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="purchase-receipts-upsert"
      purchaseReceiptId={params.purchaseReceiptId}
    />
  )
}
