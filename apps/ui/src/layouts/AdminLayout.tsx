import type { ReactNode } from "react"

import AppLayout from "./AppLayout"

type AdminLayoutProps = {
  children: ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}

export default AdminLayout
