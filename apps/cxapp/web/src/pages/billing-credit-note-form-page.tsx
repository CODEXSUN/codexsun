import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function BillingCreditNoteFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="billing"
      sectionId="credit-note-upsert"
      voucherId={params.voucherId}
    />
  )
}
