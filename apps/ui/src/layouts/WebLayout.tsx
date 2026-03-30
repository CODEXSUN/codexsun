import type { ReactNode } from "react"

import { PublicFooter } from "@/components/ux/public-footer"
import { PublicTopbar } from "@/components/ux/public-topbar"

type WebLayoutProps = {
  children: ReactNode
  appCount?: number
}

function WebLayout({ children, appCount }: WebLayoutProps) {
  return (
    <div className="theme-shell min-h-screen text-foreground">
      <PublicTopbar />
      {children}
      <PublicFooter appCount={appCount} />
    </div>
  )
}

export default WebLayout
