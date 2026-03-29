import type { ReactNode } from "react"

import { AppHeader } from "@/features/dashboard/components/navigation/app-header"
import { AppSidebar } from "@/features/dashboard/components/navigation/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type AppLayoutProps = {
  children: ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_30%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)]">
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppLayout
