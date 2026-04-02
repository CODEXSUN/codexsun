import { Link, useLocation, useParams } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DocsEntryCard } from "@/docs/components/docs-entry-card"
import { DocsPageHeader } from "@/docs/components/docs-page-header"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { DocsBrowser } from "@/docs/components/docs-browser"
import { docsCategories, docsEntries } from "@/registry/data/catalog"
import { registryBlockCategories } from "@/registry/data/blocks"
import { docsTemplateCategories } from "@/docs/data/templates"
import { registryPageCategories, registryPages } from "@/registry/data/pages"
import {
  DesignSystemComponentsPage,
  DesignSystemBlocksPage,
  DesignSystemDefaultsPage,
  DesignSystemPageEntryPage,
  DesignSystemPagesPage,
  DesignSystemReadinessPage,
} from "@/design-system/pages/design-system-workbench-page"
import { CoreWorkspaceSection } from "@core/web/src/workspace-sections"
import { BillingWorkspaceSection } from "@billing/web/src/workspace-sections"
import { EcommerceWorkspaceSection } from "@ecommerce/web/src/workspace-sections"
import { FrappeWorkspaceSection } from "@frappe/web/src/workspace-sections"

import { matchesDeskRoute } from "../desk/desk-registry"
import { useDesk } from "../desk/desk-provider"

const readinessTone = {
  active: "default",
  foundation: "secondary",
  scaffold: "outline",
  preview: "outline",
  planned: "ghost",
} as const

const uiWorkspaceSections = {
  "build-readiness": {
    description:
      "Confirm the component channels required for application delivery are present and aligned.",
    render: () => <DesignSystemReadinessPage />,
    title: "Build readiness",
  },
  "design-settings": {
    description:
      "Project-wide default component names, aliases, and default variants used across implementation work.",
    render: () => <DesignSystemDefaultsPage />,
    title: "Design settings",
  },
  blocks: {
    description:
      "Reusable blocks that combine multiple governed components for common application flows.",
    render: () => <DesignSystemBlocksPage />,
    title: "Blocks",
  },
  "form-blocks": {
    description:
      "Reusable blocks that combine multiple governed components for common application flows.",
    render: () => <DesignSystemBlocksPage />,
    title: "Blocks",
  },
  components: {
    description:
      "Governed component variants grouped by category and kept separate from blocks and full pages.",
    render: () => <DesignSystemComponentsPage />,
    title: "Components",
  },
  pages: {
    description:
      "Full-page design systems and starter variants kept separate from primitive components and blocks.",
    render: () => <DesignSystemPagesPage />,
    title: "Pages",
  },
} as const

const uiCategorySections = Object.fromEntries(
  docsCategories.map((category) => [
    `components-${category.id}`,
    {
      description: category.description,
      render: () => <DesignSystemComponentsPage categoryId={category.id} />,
      title: category.name,
    },
  ])
)

const uiBlockSections = Object.fromEntries(
  registryBlockCategories.map((category) => [
    `blocks-${category.id}`,
    {
      description: category.description,
      render: () => <DesignSystemBlocksPage categoryId={category.id} />,
      title: category.name,
    },
  ])
)

const uiPageSections = Object.fromEntries(
  registryPageCategories.map((category) => [
    `pages-${category.id}`,
    {
      description: category.description,
      render: () => <DesignSystemPagesPage pageCategoryId={category.id} />,
      title: category.name,
    },
  ])
)

const uiTemplateSections = Object.fromEntries(
  docsTemplateCategories.map((category) => [
    `pages-template-${category.slug}`,
    {
      description: `${category.name} page variants and starters.`,
      render: () => <DesignSystemPagesPage categorySlug={category.slug} />,
      title: category.name,
    },
  ])
)

const uiPageEntrySections = Object.fromEntries(
  registryPages.map((page) => [
    `pages-entry-${page.id}`,
    {
      description: page.description,
      render: () => <DesignSystemPageEntryPage pageId={page.id} />,
      title: page.name,
    },
  ])
)

export function FrameworkAppWorkspacePage({
  appId,
  categoryId,
  ledgerId,
  sectionId: forcedSectionId,
}: {
  appId?: string
  categoryId?: string
  ledgerId?: string
  sectionId?: string
}) {
  const location = useLocation()
  const params = useParams()
  const { user } = useDashboardShell()
  const { getApp } = useDesk()
  const resolvedAppId = appId ?? params.appId
  const app = resolvedAppId ? getApp(resolvedAppId) : null
  const sectionId = forcedSectionId ?? params.sectionId

  if (!app) {
    return (
      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardContent className="space-y-3 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            App not registered
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            The requested app workspace is not part of the current suite manifest.
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeModule =
    [...app.modules]
      .filter((item) => matchesDeskRoute(location.pathname, item.route, item.matchRoutes))
      .sort((left, right) => {
        const leftLength = Math.max(
          left.route.length,
          ...(left.matchRoutes ?? []).map((route) => route.length)
        )
        const rightLength = Math.max(
          right.route.length,
          ...(right.matchRoutes ?? []).map((route) => route.length)
        )

        return rightLength - leftLength
      })[0] ?? app.modules[0]
  const isUiWorkspace = app.id === "ui"
  const uiSection =
    isUiWorkspace && sectionId
      ? uiWorkspaceSections[sectionId as keyof typeof uiWorkspaceSections] ??
        uiCategorySections[sectionId as keyof typeof uiCategorySections] ??
        uiBlockSections[sectionId as keyof typeof uiBlockSections] ??
        uiPageSections[sectionId as keyof typeof uiPageSections] ??
        uiPageEntrySections[sectionId as keyof typeof uiPageEntrySections] ??
        uiTemplateSections[sectionId as keyof typeof uiTemplateSections] ??
        null
      : null
  const docsEntry =
    isUiWorkspace && sectionId && !uiSection
      ? docsEntries.find((entry) => entry.id === sectionId) ?? null
      : null
  const uiTitle = docsEntry
    ? docsEntry.name
    : uiSection?.title ?? "Design system"
  const uiDescription = docsEntry
    ? docsEntry.description
    : uiSection?.description ??
      "Browse reusable shadcn-based components by category, preview variants, and copy install-ready code."
  const coreWorkspaceContent =
    app.id === "core" ? <CoreWorkspaceSection sectionId={sectionId} /> : null
  const billingWorkspaceContent =
    app.id === "billing" ? (
      <BillingWorkspaceSection
        categoryId={categoryId}
        ledgerId={ledgerId}
        sectionId={sectionId}
      />
    ) : null
  const ecommerceWorkspaceContent =
    app.id === "ecommerce" ? (
      <EcommerceWorkspaceSection sectionId={sectionId} />
    ) : null
  const frappeWorkspaceContent =
    app.id === "frappe" ? <FrappeWorkspaceSection sectionId={sectionId} /> : null
  const customWorkspaceContent =
    coreWorkspaceContent ??
    billingWorkspaceContent ??
    ecommerceWorkspaceContent ??
    frappeWorkspaceContent
  const hideWorkspaceHero =
    app.id === "billing" &&
    [
      "categories",
      "categories-upsert",
      "chart-of-accounts",
      "chart-of-accounts-upsert",
      "voucher-groups",
      "voucher-types",
      "voucher-register",
    ].includes(sectionId ?? "overview")

  return (
    <div className="space-y-3">
      {isUiWorkspace ? (
        <>
          <DocsPageHeader
            title={uiTitle}
            description={uiDescription}
            className="-mt-1"
            aside={(
              <Badge
                variant="outline"
                className="max-w-full border-border/80 bg-background/90 px-3 py-1.5 text-left text-xs font-semibold tracking-[0.1em] text-foreground shadow-sm sm:px-4 sm:text-sm sm:tracking-[0.16em]"
              >
                Signed in as {user.displayName} ({user.actorType})
              </Badge>
            )}
          />
          {docsEntry ? (
            <DocsEntryCard entry={docsEntry} showHeader={false} />
          ) : uiSection ? (
            uiSection.render()
          ) : (
            <DocsBrowser basePath={app.route} showHeader={false} />
          )}
        </>
      ) : (
        <>
          {hideWorkspaceHero ? null : (
            <Card className="mesh-panel gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
              <CardHeader className="relative overflow-hidden px-5 py-5 md:px-6 md:py-6">
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${app.accentClassName}`} />
                <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <Badge
                    variant={readinessTone[app.readiness]}
                    className="px-4 py-1.5"
                  >
                    {app.badge}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="max-w-full border-border/80 bg-background/90 px-3 py-1.5 text-left text-xs font-semibold tracking-[0.1em] text-foreground shadow-sm sm:shrink-0 sm:px-4 sm:text-sm sm:tracking-[0.16em]"
                  >
                    Signed in as {user.displayName} ({user.actorType})
                  </Badge>
                </div>
                <div className="relative mt-3 max-w-3xl space-y-2">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {app.workspaceTitle}
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {app.workspaceSummary}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
          {customWorkspaceContent ? (
            customWorkspaceContent
          ) : (
            <>
              <Card>
                <CardContent className="grid gap-3 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-3">
                  {app.modules.map((item) => {
                    const ItemIcon = item.icon

                    return (
                      <Link
                        key={item.id}
                        to={item.route}
                        className="rounded-[1rem] border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                          </div>
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                            <ItemIcon className="size-5 text-accent" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="grid gap-4 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-3">
                  <div className="space-y-2 rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Active section
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {activeModule?.name ?? "Overview"}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {activeModule?.summary ?? app.workspaceSummary}
                    </p>
                  </div>
                  <div className="space-y-2 rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Frontend root
                    </p>
                    <p className="font-mono text-xs text-foreground">
                      {app.workspacePaths.frontendRoot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Shell, routes, and view composition for this app.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Backend root
                    </p>
                    <p className="font-mono text-xs text-foreground">
                      {app.workspacePaths.backendRoot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manifests, runtime hooks, and backend composition for this app.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Shared root
                    </p>
                    <p className="font-mono text-xs text-foreground">
                      {app.workspacePaths.sharedRoot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      App-local contracts and shared helper surfaces.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Migration root
                    </p>
                    <p className="font-mono text-xs text-foreground">
                      {app.workspacePaths.migrationRoot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ordered schema work will deepen here as the app evolves.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Seeder root
                    </p>
                    <p className="font-mono text-xs text-foreground">
                      {app.workspacePaths.seederRoot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Test and bootstrap data can stay local to the app boundary.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}

