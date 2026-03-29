import type { ReactNode } from "react"

type PublicShellProps = {
  children: ReactNode
}

function PublicShell({ children }: PublicShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.05),_transparent_38%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] text-foreground">
      {children}
    </main>
  )
}

export default PublicShell
