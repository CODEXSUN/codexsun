import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockTransferFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="transfers-upsert"
      transferId={params.transferId}
    />
  )
}
