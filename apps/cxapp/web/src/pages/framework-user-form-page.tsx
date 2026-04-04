import { useParams } from "react-router-dom"

import { FrameworkUserUpsertSection } from "../features/framework-users/framework-user-upsert-section"

export function FrameworkUserFormPage() {
  const params = useParams()

  return <FrameworkUserUpsertSection userId={params.userId} />
}
