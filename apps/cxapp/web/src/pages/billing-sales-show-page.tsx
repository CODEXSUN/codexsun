import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function BillingSalesShowPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="billing"
      sectionId="sales-vouchers-show"
      voucherId={params.voucherId}
    />
  )
}
