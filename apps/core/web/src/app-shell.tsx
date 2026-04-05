import { coreAppManifest } from "../../src/app-manifest"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  coreWorkspaceItems,
  navigationSections,
} from "@core/shared"
import { deliveryChannels, productModules } from "@cxapp/shared"

function CoreAppShell() {
  const foundationModuleCount = productModules.filter(
    (module) => module.readiness === "foundation"
  ).length

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.08),_transparent_32%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] px-6 py-8 text-foreground lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border border-border/70 bg-background/90 shadow-sm">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">
              Shared business foundation
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight">
                {coreAppManifest.name}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                {coreAppManifest.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Workspace sections
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {coreWorkspaceItems.length}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Foundation modules
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {foundationModuleCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Delivery channels
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {deliveryChannels.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-border/70 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle>Core workspace sections</CardTitle>
              <CardDescription>
                App-owned sections adapted from the imported source into the current
                suite route structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {coreWorkspaceItems.map((item) => (
                <a
                  key={item.id}
                  href={item.route}
                  className="rounded-xl border border-border/70 bg-background px-4 py-3 transition hover:border-accent/40 hover:bg-card"
                >
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.summary}
                  </p>
                </a>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/70 bg-background/90 shadow-sm">
              <CardHeader>
                <CardTitle>Navigation lanes</CardTitle>
                <CardDescription>
                  Shared module groupings for staged foundation planning.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {navigationSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {section.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {section.moduleIds.map((moduleId) => (
                        <Badge key={moduleId} variant="outline">
                          {moduleId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-background/90 shadow-sm">
              <CardHeader>
                <CardTitle>Foundation module registry</CardTitle>
                <CardDescription>
                  Shared modules available for staged adoption across core,
                  ecommerce, billing, and task.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {productModules.map((module) => (
                  <div
                    key={module.id}
                    className="rounded-xl border border-border/70 bg-background px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{module.name}</p>
                      <Badge variant="outline">{module.readiness}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {module.summary}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

export default CoreAppShell
