import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockPurchaseReceiptDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="purchase-receipts-show"
      purchaseReceiptId={params.purchaseReceiptId}
    />
  )
}
