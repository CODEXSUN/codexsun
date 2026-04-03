import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function CoreContactDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="core"
      sectionId="contacts-show"
      contactId={params.contactId}
    />
  )
}
