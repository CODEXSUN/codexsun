import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockTransferDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="transfers-show"
      transferId={params.transferId}
    />
  )
}
