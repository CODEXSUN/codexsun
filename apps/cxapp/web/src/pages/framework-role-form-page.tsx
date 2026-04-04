import { useParams } from "react-router-dom"

import { FrameworkRoleUpsertSection } from "../features/framework-users/framework-role-upsert-section"

export function FrameworkRoleFormPage() {
  const params = useParams()

  return <FrameworkRoleUpsertSection roleId={params.roleId} />
}
