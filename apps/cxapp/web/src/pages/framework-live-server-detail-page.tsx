import { useParams } from "react-router-dom"

import { FrameworkLiveServerDetailSection } from "../features/framework-live-servers/framework-live-server-detail-section"

export function FrameworkLiveServerDetailPage() {
  const params = useParams()

  if (!params.serverId) {
    return null
  }

  return <FrameworkLiveServerDetailSection serverId={params.serverId} />
}
