import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/features/dashboard/components/navigation/app-sidebar"
import { AppHeader } from "@/features/dashboard/components/navigation/app-header"
import { DeskProvider } from "@/features/framework/desk/desk-provider"
import { OreksoAssistantWidget } from '@framework-core/web/support/orekso-assistant-widget'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function AppLayout() {
  return (
    <DeskProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-2">
            <Outlet />
          </div>
          <OreksoAssistantWidget />
        </SidebarInset>
      </SidebarProvider>
    </DeskProvider>
  )
}
