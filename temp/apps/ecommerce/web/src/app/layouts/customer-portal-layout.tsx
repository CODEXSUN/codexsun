import { Outlet } from 'react-router-dom'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { CustomerPortalHeader } from '@/features/customer-portal/components/navigation/customer-portal-header'
import { CustomerPortalSidebar } from '@/features/customer-portal/components/navigation/customer-portal-sidebar'
import { StorefrontProvider } from '@/features/store/context/storefront-context'
import { OreksoAssistantWidget } from '@framework-core/web/support/orekso-assistant-widget'

export function CustomerPortalLayout() {
  return (
    <StorefrontProvider>
      <SidebarProvider defaultOpen={false}>
        <CustomerPortalSidebar />
        <SidebarInset>
          <CustomerPortalHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-2">
            <Outlet />
          </div>
          <OreksoAssistantWidget />
        </SidebarInset>
      </SidebarProvider>
    </StorefrontProvider>
  )
}
