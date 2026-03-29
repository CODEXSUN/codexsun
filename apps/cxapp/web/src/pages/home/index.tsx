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

import PublicShell from "../../layouts/public-shell"
import WorkspaceShell from "../../layouts/workspace-shell"

type HomePageProps = {
  appSuite: AppSuite
}

const appIcons = {
  cxapp: Blocks,
  billing: ReceiptText,
  ecommerce: Blocks,
  task: Workflow,
  frappe: PlugZap,
  tally: PlugZap,
}

function HomePage({ appSuite }: HomePageProps) {
  return (
    <PublicShell>
      <WorkspaceShell
        eyebrow="CxApp"
        title="Enterprise ERP interface built on framework-first composition"
      >
        <section className="space-y-8">
          <div className="max-w-3xl space-y-5">
            <p className="text-lg leading-8 text-muted-foreground">
              CxApp is the main suite-facing application. Framework owns runtime,
              DI, auth, database, and HTTP orchestration underneath it, while CxApp
              exposes the shared interface that can compose billing, commerce, task,
              and connector apps without collapsing boundaries.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="gap-2">
                Open suite
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline">
                Inspect internal apps
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Building2 className="size-5 text-primary" />
                <CardTitle>Framework-backed</CardTitle>
                <CardDescription>
                  Runtime, DI, config, and host concerns stay under framework.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle>Isolated apps</CardTitle>
                <CardDescription>
                  Each app keeps its own source, web, database, helper, and shared areas.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Workflow className="size-5 text-primary" />
                <CardTitle>Enterprise suite</CardTitle>
                <CardDescription>
                  CxApp acts as the operator shell across multiple internal and external apps.
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
                        {app.dependencies.length > 0
                          ? app.dependencies.join(", ")
                          : "none"}
                      </span>
                    </p>
                    <div className="rounded-xl border border-border/70 bg-background px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.2em]">
                        App roots
                      </p>
                      <p className="mt-2 font-mono text-xs text-foreground">
                        {app.workspace.backendRoot}
                      </p>
                      <p className="font-mono text-xs text-foreground">
                        {app.workspace.frontendRoot}
                      </p>
                    </div>
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
              <span className="text-sm font-medium">Suite interface</span>
            </div>
            <CardTitle>CxApp coordinates the application stack</CardTitle>
            <CardDescription>
              Use CxApp as the operator-facing interface while framework stays reusable
              beneath it for other standalone products.
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
                placeholder="Enter suite name"
              />
            </div>

            <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
              <p>
                Main app entry:
                <span className="ml-2 font-medium text-foreground">cxapp</span>
              </p>
              <p>
                Frontend root:
                <span className="ml-2 font-medium text-foreground">
                  apps/cxapp/web
                </span>
              </p>
              <p>
                Server root:
                <span className="ml-2 font-medium text-foreground">
                  apps/cxapp/src
                </span>
              </p>
              <p>
                Internal routes:
                <span className="ml-2 font-medium text-foreground">/internal/apps</span>
              </p>
              <p>
                External routes:
                <span className="ml-2 font-medium text-foreground">/api/apps</span>
              </p>
              <p>
                Runtime host:
                <span className="ml-2 font-medium text-foreground">
                  apps/framework/src/server
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </WorkspaceShell>
    </PublicShell>
  )
}

export default HomePage
