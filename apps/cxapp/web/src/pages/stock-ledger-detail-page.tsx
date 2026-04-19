import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockLedgerDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="stock-ledger-show"
      productId={params.productId}
    />
  )
}
