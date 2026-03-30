import { Link } from "react-router-dom"
import {
  Blocks,
  CheckCircle2,
  ClipboardList,
  Layers3,
  PackageCheck,
  Settings2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  registryBlocksByCategory,
  registryBlockCategories,
} from "@/registry/data/blocks"
import { CopyCodeButton } from "@/docs/components/copy-code-button"
import { ViewCodeDialog } from "@/docs/components/view-code-dialog"
import { useProjectDefaults } from "../context/project-defaults-provider"
import {
  applicationBuildCoverage,
  applicationBuildReadiness,
  designSystemComponentDefaults,
  designSystemGovernanceSummary,
  formatDesignSystemExampleLabel,
} from "../data/component-governance"

const workspaceLinks = {
  blocks: "/dashboard/apps/ui/blocks",
  readiness: "/dashboard/apps/ui/build-readiness",
  settings: "/dashboard/apps/ui/design-settings",
}

export function DesignSystemDefaultsPage() {
  const {
    clearPreviewDefault,
    getResolvedDefault,
    overrides,
    resetAllPreviewDefaults,
    setPreviewDefault,
  } = useProjectDefaults()
  const overriddenCount = Object.keys(overrides).length

  return (
    <div id="design-settings" className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {designSystemGovernanceSummary.governedComponents}
              </p>
              <p className="text-sm text-muted-foreground">Governed components</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
              <Layers3 className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {designSystemGovernanceSummary.defaultVariants}
              </p>
              <p className="text-sm text-muted-foreground">Default variants mapped</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background">
              <Blocks className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {designSystemGovernanceSummary.aliasedComponents}
              </p>
              <p className="text-sm text-muted-foreground">Components with aliases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Design Settings
              </p>
              <CardTitle>Project default component names and variants</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                This is the source-controlled naming layer the project should use when
                implementing UI. Example: accordion now resolves to{" "}
                <span className="font-semibold text-foreground">contained</span>,
                not box.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Source controlled</Badge>
              <Badge variant="outline">Agent readable</Badge>
              <Badge variant="outline">
                {overriddenCount} preview override{overriddenCount === 1 ? "" : "s"}
              </Badge>
              {overriddenCount > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllPreviewDefaults}
                >
                  Reset all preview defaults
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {designSystemComponentDefaults.map((componentDefault) => {
              const resolvedDefault = getResolvedDefault(
                componentDefault.componentId
              )

              if (!resolvedDefault) {
                return null
              }

              return (
                <Card
                  key={componentDefault.componentId}
                  className="overflow-hidden border-border/70 py-0 shadow-sm"
                >
                  <CardContent className="space-y-4 px-5 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-foreground">
                          {componentDefault.componentLabel}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {componentDefault.usage}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{componentDefault.applicationName}</Badge>
                        {resolvedDefault.isOverridden ? (
                          <Badge>Preview override</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Code name
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {componentDefault.applicationName}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Active default variant
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {formatDesignSystemExampleLabel(
                            componentDefault.componentId,
                            resolvedDefault.activeDefaultExampleId
                          )}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {resolvedDefault.activeDefaultExampleId}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Preview selector
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Select
                          value={resolvedDefault.activeDefaultExampleId}
                          onValueChange={(value) =>
                            setPreviewDefault(componentDefault.componentId, value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select preview default" />
                          </SelectTrigger>
                          <SelectContent>
                            {componentDefault.availableExamples.map((example) => (
                              <SelectItem key={example.id} value={example.id}>
                                {formatDesignSystemExampleLabel(
                                  componentDefault.componentId,
                                  example.id
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {resolvedDefault.isOverridden ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              clearPreviewDefault(componentDefault.componentId)
                            }
                          >
                            Restore source
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Aliases
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {componentDefault.aliases.length > 0 ? (
                          componentDefault.aliases.map((alias) => (
                            <Badge key={alias} variant="outline">
                              {alias}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No legacy alias</Badge>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-border/80 bg-background p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Guidance
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {componentDefault.notes}
                      </p>
                    </div>
                    <Link
                      to={`/dashboard/apps/ui/${componentDefault.componentId}`}
                      className="inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      Open component entry and preview
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DesignSystemBlocksPage() {
  const totalBlockCount = registryBlocksByCategory.reduce(
    (count, category) => count + category.items.length,
    0
  )

  return (
    <div id="blocks" className="space-y-5">
      <div id="form-blocks" className="h-0 scroll-mt-24" />
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Blocks
              </p>
              <CardTitle>Reusable application blocks</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                These blocks combine multiple governed components into repeatable
                application patterns so new pages do not have to start from isolated
                primitives.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {totalBlockCount} block{totalBlockCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline">
                {registryBlockCategories.length} categories
              </Badge>
              <Link
                to={workspaceLinks.settings}
                className="text-sm font-medium text-primary hover:underline"
              >
                Review defaults first
              </Link>
            </div>
          </div>
          <div className="space-y-6">
            {registryBlocksByCategory.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">
                      {category.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {category.items.length} block
                    {category.items.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="grid gap-4">
                  {category.items.map((block) => (
                    <Card
                      key={block.id}
                      className="overflow-hidden border-border/70 py-0 shadow-sm"
                    >
                      <CardContent className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-lg font-semibold text-foreground">
                                {block.name}
                              </p>
                              <div className="flex items-center gap-1">
                                <CopyCodeButton code={block.code} iconOnly />
                                <ViewCodeDialog
                                  code={block.code}
                                  title={block.name}
                                  description={block.summary}
                                />
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {block.summary}
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {block.description}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Included components
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {block.componentIds.map((componentId) => (
                                <Badge key={componentId} variant="outline">
                                  {componentId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9)_0%,_rgba(245,245,244,0.75)_100%)] p-4">
                          {block.preview}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DesignSystemReadinessPage() {
  return (
    <div id="build-readiness" className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-4 px-5 py-6 md:px-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Build Readiness
              </p>
              <CardTitle>Application build coverage</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                This checklist confirms the core component channels required to build an
                application are present in the current catalog.
              </p>
            </div>
            <div className="grid gap-4">
              {applicationBuildReadiness.map((channel) => (
                <Card
                  key={channel.id}
                  className="overflow-hidden border-border/70 py-0 shadow-sm"
                >
                  <CardContent className="space-y-3 px-5 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-foreground">
                          {channel.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {channel.summary}
                        </p>
                      </div>
                      <Badge
                        variant={
                          channel.status === "ready" ? "default" : "destructive"
                        }
                      >
                        {channel.status === "ready" ? "Ready" : "Missing"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${channel.coveragePercent}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {channel.presentComponentIds.length} /{" "}
                        {channel.requiredComponentIds.length} required components present
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {channel.requiredComponentIds.map((componentId) => {
                        const isPresent = channel.presentComponentIds.includes(componentId)

                        return (
                          <Badge
                            key={componentId}
                            variant={isPresent ? "outline" : "destructive"}
                          >
                            {componentId}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                  <PackageCheck className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {applicationBuildCoverage.presentCount} /{" "}
                    {applicationBuildCoverage.requiredCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Required components present
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border/80 bg-background p-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  {applicationBuildCoverage.missingComponentIds.length === 0
                    ? "All required application-building component channels are present in the current catalog."
                    : `Missing components: ${applicationBuildCoverage.missingComponentIds.join(", ")}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Design channel
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Defaults and blocks are wired into the UI workspace.
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Use Design Settings to govern default names and variants.</p>
                <p>Use Blocks to start common application flows faster.</p>
                <p>Keep new UI work inside these governed channels before adding new primitives.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                  <ClipboardList className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Next step
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep new pages aligned with governed defaults.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to={workspaceLinks.settings}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open design settings
                </Link>
                <Link
                  to={workspaceLinks.blocks}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open blocks
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
