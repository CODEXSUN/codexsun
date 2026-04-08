import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function BillingPurchaseReturnFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="billing"
      sectionId="purchase-return-upsert"
      voucherId={params.voucherId}
    />
  )
}
