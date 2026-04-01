import { ExternalLink, MonitorSmartphone } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Badge } from '@admin-web/components/ui/badge'
import { Button } from '@admin-web/components/ui/button'
import { Card, CardContent } from '@admin-web/components/ui/card'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@admin-web/components/ui/sidebar'
import { BillingSidebar } from '@billing-web/features/billing/components/billing-sidebar'
import { BrandGlyph } from '@admin-web/shared/branding/brand-mark'
import { useBranding } from '@admin-web/shared/branding/branding-provider'

function resolveSurfaceLabel() {
  if (typeof window === 'undefined') {
    return 'web'
  }

  return 'codexsunBillingDesktop' in window ? 'desktop' : 'web'
}

export function BillingAppShell() {
  const surface = resolveSurfaceLabel()
  const branding = useBranding()

  return (
    <SidebarProvider defaultOpen>
      <BillingSidebar />
      <SidebarInset className="min-h-svh bg-[radial-gradient(circle_at_top,#f5ede1,transparent_38%),linear-gradient(180deg,#f8f3ec_0%,#fbf8f3_52%,#f1e8dc_100%)]">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <BrandGlyph className="size-11 rounded-[1rem]" iconClassName="size-5" shadowless />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    {branding.brandName}
                  </p>
                  <h1 className="text-lg font-semibold text-foreground">Business workspace</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-2 rounded-full px-3 py-1">
                <MonitorSmartphone className="size-3.5" />
                {surface}
              </Badge>
              <Button asChild variant="outline" className="rounded-full">
                <a href="https://codexsun.com" target="_blank" rel="noreferrer">
                  Learn more
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <Card className="mb-4 overflow-hidden border-border/70 bg-background/80 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <BrandGlyph className="size-11 rounded-[1rem]" iconClassName="size-5" shadowless />
                <div>
                  <p className="font-medium text-foreground">{branding.brandName} suite</p>
                  <p className="text-sm text-muted-foreground">
                    One workspace for ecommerce, CRM, HRMS, accounts, and integrations.
                  </p>
                </div>
              </div>
              <Badge className="rounded-full px-3 py-1">Authenticated workspace</Badge>
            </CardContent>
          </Card>

          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
