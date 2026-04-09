import type { ReactNode } from "react"

import { AppHeader } from "@/features/dashboard/components/navigation/app-header"
import { AppSidebar } from "@/features/dashboard/components/navigation/app-sidebar"
import { GlobalLoadingProvider } from "@/features/dashboard/loading/global-loading-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type AppLayoutProps = {
  children: ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <GlobalLoadingProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="theme-shell min-h-screen">
            <AppHeader />
            <main className="mx-auto w-full max-w-[96rem] px-4 py-4 md:px-6 md:py-6">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </GlobalLoadingProvider>
  )
}

export default AppLayout
