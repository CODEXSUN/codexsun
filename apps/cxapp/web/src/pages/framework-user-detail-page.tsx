import { useParams } from "react-router-dom"

import { FrameworkUserDetailSection } from "../features/framework-users/framework-user-detail-section"

export function FrameworkUserDetailPage() {
  const params = useParams()

  if (!params.userId) {
    return null
  }

  return <FrameworkUserDetailSection userId={params.userId} />
}
