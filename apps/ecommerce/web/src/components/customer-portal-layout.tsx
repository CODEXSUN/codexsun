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
        <div className="theme-shell min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_30%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.12),transparent_28%),radial-gradient(circle_at_bottom_left,hsl(var(--secondary)/0.14),transparent_30%),linear-gradient(180deg,hsl(var(--background)/0.98)_0%,hsl(var(--primary)/0.04)_45%,hsl(var(--background)/0.98)_100%)]">
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
