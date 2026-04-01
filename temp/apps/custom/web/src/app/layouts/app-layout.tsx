import { NavLink, Outlet } from 'react-router-dom'
import { customWorkbenchRoutes } from '@custom-domain/manifest'
import { Badge } from '@ui/components/ui/badge'
import { Button } from '@ui/components/ui/button'
import { cn } from '@ui/lib/utils'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_24%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs tracking-[0.2em] uppercase">
                Custom App Architecture
              </Badge>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Clean app root for server and frontend work
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This scaffold keeps backend, frontend, domain contracts, module folders, and model folders separate
                  from the overloaded ecommerce host.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {customWorkbenchRoutes.map((route) => (
                <Button key={route.path} asChild variant="ghost" className="justify-start rounded-full px-4">
                  <NavLink
                    to={route.path}
                    end={route.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'rounded-full border border-transparent transition-colors',
                        isActive ? 'bg-accent text-accent-foreground hover:bg-accent' : 'hover:border-border',
                      )
                    }
                  >
                    {route.label}
                  </NavLink>
                </Button>
              ))}
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
