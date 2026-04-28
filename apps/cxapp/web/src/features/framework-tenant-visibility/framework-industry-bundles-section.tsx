import { useEffect, useState } from "react"

import type { TenantVisibilityAdminSnapshot } from "@cxapp/shared"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { getTenantVisibilityAdminSnapshot } from "./tenant-visibility-api"

function BundleSummaryBadge({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function FrameworkIndustryBundlesSection() {
  const [snapshot, setSnapshot] = useState<TenantVisibilityAdminSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useGlobalLoading(isLoading)

  useEffect(() => {
    let isMounted = true

    async function loadSnapshot() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getTenantVisibilityAdminSnapshot()

        if (isMounted) {
          setSnapshot(response.item)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load industry bundles.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSnapshot()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="space-y-6" data-technical-name="page.framework.industry-bundles">
      <Card
        className="border-border/70 bg-background/95 shadow-sm"
        data-technical-name="section.framework.industry-bundles.summary"
      >
        <CardHeader className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Framework Tenancy
            </p>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Bundle registry
            </CardTitle>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Review the first live industry bundles and client overlays that drive tenant-aware app
              and module visibility across the shared cxapp shell.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <BundleSummaryBadge label="Bundles" value={snapshot?.bundles.length ?? 0} />
            <BundleSummaryBadge label="Overlays" value={snapshot?.clientOverlays.length ?? 0} />
            <BundleSummaryBadge label="Apps" value={snapshot?.apps.length ?? 0} />
            <BundleSummaryBadge
              label="Modules"
              value={snapshot?.apps.reduce((total, app) => total + app.modules.length, 0) ?? 0}
            />
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div
        className="space-y-6"
        data-technical-name="section.framework.industry-bundles.registry"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Industry bundles</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Each bundle defines the baseline apps and sidebar module groups for one industry pack.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {(snapshot?.bundles ?? []).map((bundle) => (
              <Card key={bundle.id} className="border-border/70 bg-card/80 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
                      >
                        {bundle.id}
                      </Badge>
                      <CardTitle className="text-xl font-semibold tracking-tight">
                        {bundle.displayName}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{bundle.enabledAppIds.length} apps</Badge>
                      <Badge variant="secondary">{bundle.enabledModuleIds.length} modules</Badge>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{bundle.summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Default apps
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bundle.enabledAppIds.map((appId) => (
                        <Badge key={appId} variant="outline">
                          {snapshot?.apps.find((app) => app.appId === appId)?.label ?? appId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Default modules
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bundle.enabledModuleIds.map((moduleId) => {
                        const module = snapshot?.apps
                          .flatMap((app) => app.modules)
                          .find((item) => item.id === moduleId)

                        return (
                          <Badge key={moduleId} variant="secondary">
                            {module?.label ?? moduleId}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Client overlays</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Overlays apply tenant- or client-specific additions and removals on top of the selected
              industry bundle.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {(snapshot?.clientOverlays ?? []).map((clientOverlay) => (
              <Card key={clientOverlay.id} className="border-border/70 bg-card/80 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
                      >
                        {clientOverlay.id}
                      </Badge>
                      <CardTitle className="text-xl font-semibold tracking-tight">
                        {clientOverlay.displayName}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {clientOverlay.industryId ?? "all industries"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{clientOverlay.summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Adds
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {clientOverlay.enabledAppIds.map((appId) => (
                        <Badge key={`app:${appId}`} variant="outline">
                          {snapshot?.apps.find((app) => app.appId === appId)?.label ?? appId}
                        </Badge>
                      ))}
                      {clientOverlay.enabledModuleIds.map((moduleId) => {
                        const module = snapshot?.apps
                          .flatMap((app) => app.modules)
                          .find((item) => item.id === moduleId)

                        return (
                          <Badge key={`module:${moduleId}`} variant="outline">
                            {module?.label ?? moduleId}
                          </Badge>
                        )
                      })}
                      {clientOverlay.enabledAppIds.length === 0 &&
                      clientOverlay.enabledModuleIds.length === 0 ? (
                        <Badge variant="secondary">No added surfaces</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Hides
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {clientOverlay.disabledAppIds.map((appId) => (
                        <Badge key={`hidden-app:${appId}`} variant="secondary">
                          {snapshot?.apps.find((app) => app.appId === appId)?.label ?? appId}
                        </Badge>
                      ))}
                      {clientOverlay.disabledModuleIds.map((moduleId) => {
                        const module = snapshot?.apps
                          .flatMap((app) => app.modules)
                          .find((item) => item.id === moduleId)

                        return (
                          <Badge key={`hidden-module:${moduleId}`} variant="secondary">
                            {module?.label ?? moduleId}
                          </Badge>
                        )
                      })}
                      {clientOverlay.disabledAppIds.length === 0 &&
                      clientOverlay.disabledModuleIds.length === 0 ? (
                        <Badge variant="secondary">No hidden surfaces</Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
