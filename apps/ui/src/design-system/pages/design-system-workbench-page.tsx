import { Link } from "react-router-dom"
import {
  ArrowLeft,
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
import { docsCategories, docsEntries } from "@/registry/data/catalog"
import {
  registryPages,
  registryPageCategories,
  registryPagesByCategory,
} from "@/registry/data/pages"
import { DocsTemplatesSectionContent } from "@/docs/components/docs-templates-section"
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

export function DesignSystemBlocksPage({
  categoryId,
  blockId,
}: {
  categoryId?: (typeof registryBlockCategories)[number]["id"]
  blockId?: string
} = {}) {
  return <DesignSystemBlocksContent categoryId={categoryId} blockId={blockId} />
}

export function DesignSystemBlocksContent({
  categoryId,
  blockId,
}: {
  categoryId?: (typeof registryBlockCategories)[number]["id"]
  blockId?: string
}) {
  const visibleCategories = categoryId
    ? registryBlocksByCategory.filter((category) => category.id === categoryId)
    : registryBlocksByCategory
  const isSingleBlockView = Boolean(blockId)
  const filteredCategories = blockId
    ? visibleCategories
        .map((category) => ({
          ...category,
          items: category.items.filter((block) => block.id === blockId),
        }))
        .filter((category) => category.items.length > 0)
    : visibleCategories
  const totalBlockCount = registryBlocksByCategory.reduce(
    (count, category) => count + category.items.length,
    0
  )

  return (
    <div id="blocks" className="space-y-5">
      <div id="form-blocks" className="h-0 scroll-mt-24" />
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          {isSingleBlockView ? null : (
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
          )}
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                {isSingleBlockView ? null : (
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
                )}
                <div className="grid gap-4">
                  {category.items.map((block) => (
                    <Card
                      key={block.id}
                      className="overflow-hidden border-border/70 py-0 shadow-sm"
                    >
                      <CardContent className="space-y-5 px-5 py-5">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-lg font-semibold text-foreground">
                                {block.name}
                              </p>
                              {isSingleBlockView ? null : (
                                <Badge variant="outline">{category.name}</Badge>
                              )}
                            </div>
                            {isSingleBlockView ? null : (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  {block.summary}
                                </p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                  {block.description}
                                </p>
                              </>
                            )}
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
                        <div className="theme-preview-surface overflow-hidden rounded-[1.5rem] border border-border/70 p-4">
                          {block.preview}
                        </div>
                        <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Code
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Open the dedicated source for this block or copy it directly into a feature.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CopyCodeButton code={block.code} />
                              <ViewCodeDialog
                                code={block.code}
                                title={block.name}
                                description={block.summary}
                              />
                            </div>
                          </div>
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

export function DesignSystemComponentsPage({
  categoryId,
}: {
  categoryId?: (typeof docsCategories)[number]["id"]
}) {
  const visibleCategories = categoryId
    ? docsCategories.filter((category) => category.id === categoryId)
    : docsCategories
  const visibleEntries = categoryId
    ? docsEntries.filter((entry) => entry.category === categoryId)
    : docsEntries

  return (
    <div id="components" className="space-y-5">
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Components
              </p>
              <CardTitle>Component Design System</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Govern the component layer separately from blocks and full-page systems.
                This track covers the current component library and its variant sets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {docsEntries.length} component{docsEntries.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline">
                {docsCategories.length} categories
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden border-border/70 py-0 shadow-sm">
                <CardContent className="space-y-3 px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{category.name}</p>
                    <Badge variant="outline">{category.items.length} items</Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleEntries.map((entry) => (
          <Link
            key={entry.id}
            to={`/dashboard/apps/ui/${entry.id}`}
            className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
          >
            <div className="space-y-4 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                    <entry.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                </div>
                <Badge variant="outline">
                  {entry.examples.length} variant{entry.examples.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.examples.slice(0, 4).map((example) => (
                  <Badge key={example.id} variant="secondary">
                    {example.title}
                  </Badge>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function DesignSystemPagesPage({
  pageCategoryId,
  categorySlug,
}: {
  pageCategoryId?: (typeof registryPageCategories)[number]["id"]
  categorySlug?: string
}) {
  const visiblePageCategories = pageCategoryId
    ? registryPagesByCategory.filter((category) => category.id === pageCategoryId)
    : registryPagesByCategory

  return (
    <div id="pages" className="space-y-5">
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Pages
              </p>
              <CardTitle>Full Page Design System</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Full-page starters and larger page-level variants live in their own
                channel so page systems do not get mixed into primitive components or reusable blocks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Page variants</Badge>
              {pageCategoryId ? <Badge variant="outline">{pageCategoryId}</Badge> : null}
              {categorySlug ? <Badge variant="outline">{categorySlug}</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-5 px-5 py-6 md:px-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Page Variants
            </p>
            <CardTitle>Page Catalog</CardTitle>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Full-page registry patterns and operational page systems kept separate from
              blocks, each with its own dedicated preview page.
            </p>
          </div>
          <div className="space-y-6">
            {visiblePageCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <Badge variant="outline">
                    {category.items.length} page{category.items.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="grid gap-4">
                  {category.items.map((page) => (
                    <Card
                      key={page.id}
                      className="overflow-hidden border-border/70 py-0 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
                    >
                      <CardContent className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold text-foreground">{page.name}</p>
                              <Badge variant="secondary">Dedicated page</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{page.summary}</p>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {page.description}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Included components
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {page.componentIds.map((componentId) => (
                                <Badge key={componentId} variant="outline">
                                  {componentId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Link
                            to={`/dashboard/apps/ui/pages-entry-${page.id}`}
                            className="inline-flex text-sm font-medium text-primary hover:underline"
                          >
                            Open full page preview
                          </Link>
                        </div>
                        <div className="theme-preview-surface overflow-hidden rounded-[1.5rem] border border-border/70 p-4">
                          {page.preview}
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

      <DocsTemplatesSectionContent categorySlug={categorySlug} />
    </div>
  )
}

export function DesignSystemPageEntryPage({
  pageId,
}: {
  pageId: string
}) {
  const page = registryPages.find((entry) => entry.id === pageId) ?? null

  if (!page) {
    return null
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="space-y-4 px-5 py-6 md:px-6">
          <Link
            to="/dashboard/apps/ui/pages"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to pages
          </Link>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Page Entry
              </p>
              <CardTitle>{page.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{page.summary}</p>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {page.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <CopyCodeButton code={page.code} iconOnly />
              <ViewCodeDialog
                code={page.code}
                title={page.name}
                description={page.summary}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{page.category}</Badge>
            <Badge variant="outline">{page.componentIds.length} components</Badge>
            {page.componentIds.map((componentId) => (
              <Badge key={componentId} variant="outline">
                {componentId}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
        <CardContent className="theme-preview-surface overflow-hidden px-5 py-6 md:px-6">
          {page.preview}
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
