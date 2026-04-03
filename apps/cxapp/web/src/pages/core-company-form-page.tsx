import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function CoreCompanyFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="core"
      sectionId="companies-upsert"
      companyId={params.companyId}
    />
  )
}
