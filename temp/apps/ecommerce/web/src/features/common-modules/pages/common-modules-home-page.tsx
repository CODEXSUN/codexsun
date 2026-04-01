import { Link } from 'react-router-dom'
import { commonModuleMenuGroups, getCommonModuleHref } from '../config/common-module-navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function CommonModulesHomePage() {
  return (
    <div className="space-y-6">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 p-8">
          <Badge>Application menu</Badge>
          <CardTitle className="mt-3 text-4xl">Common modules workspace</CardTitle>
          <CardDescription className="max-w-3xl text-base">
            Manage the shared masters that drive geography, contacts, catalog, logistics, and commercial setup across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-8 lg:grid-cols-2">
          {commonModuleMenuGroups.map((group) => (
            <div key={group.key} className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-accent/15">
                  <group.icon className="size-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{group.title}</p>
                  <p className="text-sm text-muted-foreground">{group.items.length} modules</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.key}
                    to={getCommonModuleHref(item.key)}
                    className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 text-sm transition hover:bg-muted/60"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{item.title}</span>
                    </span>
                    <span className="text-muted-foreground">Open</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
