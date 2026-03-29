import {
  ArrowRight,
  Blocks,
  Building2,
  PlugZap,
  ReceiptText,
  ShieldCheck,
  Workflow,
} from "lucide-react"

import type { AppSuite } from "@framework/application/app-manifest"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type HomePageProps = {
  appSuite: AppSuite
}

const appIcons = {
  billing: ReceiptText,
  ecommerce: Blocks,
  task: Workflow,
  frappe: PlugZap,
  tally: PlugZap,
}

function HomePage({ appSuite }: HomePageProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.05),_transparent_38%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-border/60 pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {appSuite.framework.name}
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
              Enterprise ERP suite built from a framework-first composition root
            </h1>
          </div>
          <Button className="hidden sm:inline-flex">Open app suite</Button>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.15fr_0.95fr] lg:items-start">
          <section className="space-y-8">
            <div className="max-w-3xl space-y-5">
              <p className="text-lg leading-8 text-muted-foreground">
                Codexsun now starts from the framework host and composes standalone
                apps through manifests, dependency references, internal routes, and
                external API contracts. Core stays shared, apps stay bounded, and
                connectors stay isolated.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2">
                  Browse modules
                  <ArrowRight className="size-4" />
                </Button>
                <Button size="lg" variant="outline">
                  View internal API
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Building2 className="size-5 text-primary" />
                  <CardTitle>Framework-led</CardTitle>
                  <CardDescription>
                    One composition root owns DI, runtime config, database, and HTTP.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <ShieldCheck className="size-5 text-primary" />
                  <CardTitle>API split</CardTitle>
                  <CardDescription>
                    Internal app routes and external API routes are separated on purpose.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Blocks className="size-5 text-primary" />
                  <CardTitle>Standalone apps</CardTitle>
                  <CardDescription>
                    Billing, commerce, task, and connector apps stay independently scoped.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {appSuite.apps.map((app) => {
                const Icon =
                  appIcons[app.id as keyof typeof appIcons] ?? Building2

                return (
                  <Card key={app.id}>
                    <CardHeader>
                      <Icon className="size-5 text-primary" />
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>{app.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Kind: <span className="font-medium text-foreground">{app.kind}</span>
                      </p>
                      <p>
                        Depends on:{" "}
                        <span className="font-medium text-foreground">
                          {app.dependencies.join(", ")}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          <Card className="border border-border/70 bg-background/90 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Blocks className="size-5" />
                <span className="text-sm font-medium">Composition summary</span>
              </div>
              <CardTitle>Framework + core + API anchor the suite</CardTitle>
              <CardDescription>
                Each app stays installable and standalone, but the framework remains
                the single starting point for runtime assembly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="workspace-name">
                  Suite name
                </label>
                <Input
                  id="workspace-name"
                  defaultValue="codexsun"
                  placeholder="Enter workspace name"
                />
              </div>

              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <p>
                  Internal routes:
                  <span className="ml-2 font-medium text-foreground">/internal/apps</span>
                </p>
                <p>
                  External routes:
                  <span className="ml-2 font-medium text-foreground">/api/apps</span>
                </p>
                <p>
                  Health:
                  <span className="ml-2 font-medium text-foreground">/health</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

export default HomePage
