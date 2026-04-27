import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockDeliveryNoteDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="delivery-note-show"
      deliveryNoteId={params.deliveryNoteId}
    />
  )
}
