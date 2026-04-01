import { Link } from 'react-router-dom'
import { Blocks, Building2, FileImage, Settings2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const coreSettingAreas = [
  {
    title: 'Company Defaults',
    description: 'Maintain legal entity details, branding context, and organization-level identity used across the shared foundation.',
    href: '/admin/dashboard/companies',
    icon: Building2,
  },
  {
    title: 'Contact Structure',
    description: 'Review contact records and shared party information that feed multiple app surfaces.',
    href: '/admin/dashboard/contacts',
    icon: Users,
  },
  {
    title: 'Media And Assets',
    description: 'Manage shared media storage, reusable assets, and file references owned by the core foundation.',
    href: '/admin/dashboard/media',
    icon: FileImage,
  },
  {
    title: 'Common Modules',
    description: 'Configure reusable masters like locations, product references, and shared lookup data for every app.',
    href: '/admin/dashboard/common',
    icon: Blocks,
  },
]

export function CoreSettingsPage() {
  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge>Core app</Badge>
              <div>
                <CardTitle className="text-3xl">Core settings</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  This page is for core-owned configuration only. Framework-level runtime, environment, and system governance stays under the Framework settings surface.
                </CardDescription>
              </div>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background">
              <Settings2 className="size-5 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          {coreSettingAreas.map((area) => {
            const Icon = area.icon

            return (
              <Link
                key={area.title}
                to={area.href}
                className="rounded-[1.25rem] border border-border/70 bg-card/70 p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{area.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{area.description}</p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                    <Icon className="size-5 text-accent" />
                  </div>
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
