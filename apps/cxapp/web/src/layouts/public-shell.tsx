import type { ReactNode } from "react"

import { PublicFooter } from "@/components/ux/public-footer"
import { PublicTopbar } from "@/components/ux/public-topbar"

type PublicShellProps = {
  children: ReactNode
  appCount?: number
}

function PublicShell({ children, appCount }: PublicShellProps) {
  return (
    <div className="theme-shell min-h-screen text-foreground">
      <PublicTopbar />
      <main>{children}</main>
      <PublicFooter appCount={appCount} />
    </div>
  )
}

export default PublicShell
