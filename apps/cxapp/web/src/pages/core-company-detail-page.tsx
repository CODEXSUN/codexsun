import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function CoreCompanyDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="core"
      sectionId="companies-show"
      companyId={params.companyId}
    />
  )
}
