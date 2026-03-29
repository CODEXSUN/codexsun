import type { ReactNode } from "react"

import AdminLayout from "./AdminLayout"

type SAdminLayoutProps = {
  children: ReactNode
}

function SAdminLayout({ children }: SAdminLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>
}

export default SAdminLayout
