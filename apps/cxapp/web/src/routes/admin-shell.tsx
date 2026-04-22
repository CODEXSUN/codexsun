import type { ReactNode } from "react"

import type { AppSuite } from "@framework/application/app-manifest"
import { createFrameworkBrowserContainer } from "@framework/di/browser-container"
import { FRAMEWORK_TOKENS } from "@framework/di/tokens"
import type { DashboardUser } from "@/features/dashboard/types"
import BaseAdminLayout from "@/layouts/AdminLayout"

import { DeskProvider } from "../desk/desk-provider"

const container = createFrameworkBrowserContainer()
const appSuite = container.resolve<AppSuite>(FRAMEWORK_TOKENS.appSuite)

export function AdminShell({
  children,
  onLogout,
  user,
}: {
  children: ReactNode
  onLogout: () => void
  user: DashboardUser
}) {
  return (
    <DeskProvider appSuite={appSuite} user={user} onLogout={onLogout}>
      <BaseAdminLayout>{children}</BaseAdminLayout>
    </DeskProvider>
  )
}
