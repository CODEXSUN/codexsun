import { useParams } from "react-router-dom"

import { FrameworkPermissionUpsertSection } from "../features/framework-users/framework-permission-upsert-section"
import { FrameworkPermissionsPage } from "./framework-permissions-page"

export function FrameworkPermissionFormPage({ mode }: { mode: "list" | "form" }) {
  const params = useParams()

  if (mode === "list") {
    return <FrameworkPermissionsPage />
  }

  return <FrameworkPermissionUpsertSection permissionId={params.permissionId} />
}
