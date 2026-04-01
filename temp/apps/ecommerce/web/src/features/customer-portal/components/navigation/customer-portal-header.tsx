import { Home, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { buildCustomerPortalPath } from '@framework-core/web/auth/lib/portal-routing'
import { customerPortalLinks, resolveCustomerPortalTitle } from '@/features/customer-portal/lib/customer-portal-nav'
import { ThemeSwitcher } from '@/shared/theme/theme-switcher'

export function CustomerPortalHeader() {
  const location = useLocation()
  const { logout } = useAuth()
  const currentTitle = resolveCustomerPortalTitle(location.pathname)

  return (
    <header className="flex min-h-12 shrink-0 items-center justify-between gap-4 border-b border-border/60 px-4 py-1.5">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="hidden h-5 md:block" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" asChild className="shrink-0">
              <Link to={buildCustomerPortalPath()} aria-label="Go to customer dashboard">
                <Home className="size-4" />
              </Link>
            </Button>
            <h1 className="truncate text-lg font-semibold text-foreground">{currentTitle}</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {customerPortalLinks.slice(1, 5).map((link) => (
          <Button key={link.href} variant="outline" size="sm" asChild>
            <Link to={link.href}>
              <link.icon className="size-4" />
              {link.title}
            </Link>
          </Button>
        ))}
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <Home className="size-4" />
            Store
          </Link>
        </Button>
        <ThemeSwitcher />
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
