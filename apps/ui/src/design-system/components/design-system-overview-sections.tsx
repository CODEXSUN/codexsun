import { Link } from "react-router-dom"
import {
  ClipboardList,
  PackageCheck,
  Settings2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const overviewSections = [
  {
    description: "Project component names, aliases, and default variants.",
    href: "design-settings",
    icon: Settings2,
    id: "design-settings",
    name: "Design Settings",
  },
  {
    description: "Combined blocks for common flows and repeated application patterns.",
    href: "blocks",
    icon: ClipboardList,
    id: "blocks",
    name: "Blocks",
  },
  {
    description: "Checklist coverage for the core components needed to build product screens.",
    href: "build-readiness",
    icon: PackageCheck,
    id: "build-readiness",
    name: "Build Readiness",
  },
] as const

export function DesignSystemOverviewSections({
  basePath,
}: {
  basePath?: string
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-5 px-5 py-6 md:px-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            System
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Design system channels
          </h2>
          <p className="text-sm text-muted-foreground">
            Govern defaults, reuse composed blocks, and confirm build coverage from
            the same UI workspace.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {overviewSections.map((section) => {
            const SectionIcon = section.icon
            const content = (
              <div className="flex h-full flex-col justify-between gap-5 rounded-[1.5rem] border border-border/70 bg-card/90 p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card">
                <div className="space-y-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
                    <SectionIcon className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{section.name}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">Workspace</Badge>
                  <span className="text-sm font-medium text-primary">Open</span>
                </div>
              </div>
            )

            return basePath ? (
              <Link key={section.id} to={`${basePath}/${section.href}`}>
                {content}
              </Link>
            ) : (
              <a key={section.id} href={`#${section.href}`}>
                {content}
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
