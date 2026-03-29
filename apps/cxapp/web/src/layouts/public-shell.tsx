import type { ReactNode } from "react"

import { PublicFooter } from "@/components/ux/public-footer"
import { PublicTopbar } from "@/components/ux/public-topbar"

type PublicShellProps = {
  children: ReactNode
  appCount?: number
}

function PublicShell({ children, appCount }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.05),_transparent_38%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] text-foreground">
      <PublicTopbar />
      <main>{children}</main>
      <PublicFooter appCount={appCount} />
    </div>
  )
}

export default PublicShell
