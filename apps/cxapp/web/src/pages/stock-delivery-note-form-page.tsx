import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockDeliveryNoteFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="delivery-note-upsert"
      deliveryNoteId={params.deliveryNoteId}
    />
  )
}
