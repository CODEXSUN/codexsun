import { ArrowUpRight, Plus, Search, Bell, UserRoundSearch, SunMedium } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRuntimeBrand } from '@/features/branding/runtime-brand-provider'
import { useDashboardShell } from '@/features/dashboard/dashboard-shell'

export function DashboardPage({
  variant = 'workspace',
}: {
  variant?: 'workspace' | 'admin'
}) {
  const { apps, links, services, user } = useDashboardShell()
  const { brand } = useRuntimeBrand()
  const isAdminVariant = variant === 'admin'
  const adminQuickActions = [
    {
      id: 'create',
      label: 'Create',
      icon: Plus,
      to: links.settings,
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      to: links.dashboard,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      to: links.systemUpdate,
    },
    {
      id: 'users',
      label: 'Users',
      icon: UserRoundSearch,
      to: links.settings,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: SunMedium,
      to: links.settings,
    },
  ]

  return (
    <div className="space-y-3">
      <Card className="mesh-panel gap-0 overflow-hidden py-0">
        <CardHeader className="border-b border-border/60 px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
            <Badge className="px-4 py-1.5">
              {isAdminVariant ? 'Admin' : 'Framework'}
            </Badge>
            <Badge
              variant="outline"
              className="max-w-full border-border/80 bg-background/90 px-3 py-1.5 text-left text-xs font-semibold tracking-[0.1em] text-foreground shadow-sm sm:shrink-0 sm:px-4 sm:text-sm sm:tracking-[0.16em]"
            >
              Signed in as {user.displayName} ({user.actorType})
            </Badge>
          </div>
          <div className="mt-3 max-w-3xl space-y-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Business software, made to work together.
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                {brand?.shortAbout ??
                  `${brand?.brandName ?? 'Codexsun'} delivers online shopping ecommerce, CRM, HRMS, accounts, and integrations in one connected platform. This framework desk opens every workspace from one shared shell.`}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isAdminVariant ? (
        <Card>
          <CardHeader className="px-5 py-4 md:px-6">
            <CardTitle>Admin quick actions</CardTitle>
            <CardDescription>
              Framework control pages and cross-app oversight for administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 md:px-6 md:pb-6">
            <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-[1.4rem] bg-background/90 p-2 shadow-sm">
              {adminQuickActions.map((action) => {
                const ActionIcon = action.icon

                return (
                  <Link
                    key={action.id}
                    to={action.to}
                    aria-label={action.label}
                    className="inline-flex size-11 items-center justify-center rounded-xl bg-card/80 text-muted-foreground transition hover:-translate-y-0.5 hover:bg-card hover:text-foreground"
                  >
                    <ActionIcon className="size-5" />
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="px-5 py-4 md:px-6">
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Click any app icon to open its workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pb-5 pt-0 md:grid-cols-2 md:px-6 md:pb-6 xl:grid-cols-3">
          {apps.map((app) => {
            const AppIcon = app.icon

            return (
              <Link
                key={app.id}
                to={app.route}
                className="group relative overflow-hidden rounded-[1.15rem] border border-border/70 bg-card/75 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${app.accentClassName}`} />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2.5">
                    <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-background/90 shadow-sm">
                      <AppIcon className="size-6 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 text-lg font-semibold text-foreground">{app.name}</p>
                        <Badge variant="secondary">{app.readiness}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{app.summary}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="mt-0.5 size-5 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                </div>
                <div className="relative mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="truncate">
                    {app.badge}
                  </Badge>
                  <Badge variant="outline">{app.modules.length} modules</Badge>
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="px-5 py-4 md:px-6">
            <CardTitle>Framework services</CardTitle>
            <CardDescription>
              Shared runtime blocks that every app workspace can rely on.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 pb-5 pt-0 md:px-6 md:pb-6">
            {services.map((service) => {
              const ServiceIcon = service.icon

              return (
                <div
                  key={service.id}
                  className="flex flex-col gap-3 rounded-[1rem] bg-muted/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-background">
                      <ServiceIcon className="size-5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.summary}</p>
                    </div>
                  </div>
                  <Badge
                    variant={service.readiness === 'active' ? 'default' : 'secondary'}
                    className="self-start sm:self-center"
                  >
                    {service.readiness}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
