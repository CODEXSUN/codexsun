import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DocsPageHeader } from "@/features/docs/components/docs-page-header"
import {
  docsCategories,
  docsEntries,
  docsStats,
  docsTemplates,
} from "@/features/component-registry/data/catalog"
import { DocsBrowser } from "@/features/docs/components/docs-browser"

export function DocsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)]">
      <div className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)_280px] lg:px-6">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <Card className="h-full gap-0 overflow-hidden border-border/70 bg-card/90 py-0 shadow-sm">
            <CardContent className="space-y-6 px-4 py-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  UI
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Design system
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Shared shadcn-based components for Codexsun and future open-source docs.
                </p>
              </div>

              <nav className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      System
                    </p>
                    <Badge variant="outline">3</Badge>
                  </div>
                  <div className="space-y-1">
                    <a
                      href="#design-settings"
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      <span>Design Settings</span>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </a>
                    <a
                      href="#blocks"
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      <span>Blocks</span>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </a>
                    <a
                      href="#build-readiness"
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      <span>Build Readiness</span>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {docsCategories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {category.name}
                      </p>
                      <Badge variant="outline">{category.items.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {category.items.map((itemId) => {
                        const entry = docsEntries.find((candidate) => candidate.id === itemId)

                        if (!entry) {
                          return null
                        }

                        return (
                          <a
                            key={entry.id}
                            href={`#${entry.id}`}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                          >
                            <span>{entry.name}</span>
                            <ArrowUpRight className="size-4 text-muted-foreground" />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Templates
                    </p>
                    <Badge variant="outline">{docsTemplates.length}</Badge>
                  </div>
                  <a
                    href="#templates"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                  >
                    <span>Docs Templates</span>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </a>
                </div>
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-5">
          <DocsPageHeader
            title="Design system"
            description="Shared shadcn-based components for Codexsun and future open-source docs."
            className="-mt-1"
          />
          <DocsBrowser showHeader={false} />
        </main>

        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="space-y-4">
            {docsStats.map((stat) => {
              const StatIcon = stat.icon

              return (
                <Card key={stat.label} className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm">
                  <CardContent className="flex items-center gap-4 px-4 py-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
                      <StatIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm">
              <CardContent className="space-y-3 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Publishing
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Keep the docs tied to real component imports, sample code, live previews,
                  and template metadata so this surface stays extractable without rewriting the
                  content model.
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}

