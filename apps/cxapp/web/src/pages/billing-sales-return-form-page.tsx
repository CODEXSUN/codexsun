import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function BillingSalesReturnFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="billing"
      sectionId="sales-return-upsert"
      voucherId={params.voucherId}
    />
  )
}
