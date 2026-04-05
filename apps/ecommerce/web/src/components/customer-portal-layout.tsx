import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { PortalSectionId } from "../lib/customer-portal"
import { CustomerPortalHeader } from "./customer-portal-header"
import { CustomerPortalSidebar } from "./customer-portal-sidebar"

export function CustomerPortalLayout({
  activeSection,
  title,
  description,
  children,
}: {
  activeSection: PortalSectionId
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <CustomerPortalSidebar activeSection={activeSection} />
      <SidebarInset>
        <div className="theme-shell min-h-screen bg-[linear-gradient(180deg,#f6efe7_0%,#f3ece5_18%,#f7f3ee_100%)]">
          <CustomerPortalHeader activeSection={activeSection} />
          <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
            <section
              className="min-w-0 space-y-6"
              aria-label={`${title} ${description}`.trim()}
            >
              {children}
            </section>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
