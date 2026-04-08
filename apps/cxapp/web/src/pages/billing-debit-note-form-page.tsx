import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function BillingDebitNoteFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="billing"
      sectionId="debit-note-upsert"
      voucherId={params.voucherId}
    />
  )
}
