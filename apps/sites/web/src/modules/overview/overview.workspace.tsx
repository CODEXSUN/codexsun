import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace";
import {
  ExternalLinkIcon,
  Globe2Icon,
  Layers3Icon,
  LayoutDashboardIcon,
  PlusIcon,
  RefreshCw,
  RocketIcon,
  TerminalIcon
} from "lucide-react";
import { useState } from "react";
import { useSites, type SiteGateway } from "../site/index.js";
import { SiteWorkspace } from "../site/site.workspace.js";
import { useSitesOverview } from "./overview.hooks.js";
import type { SitesOverviewGateway } from "./overview.services.js";

type SitesView = "guide" | "portfolios" | "studio";

export function SitesOverviewWorkspace({
  gateway,
  guide = false,
  onNavigate,
  siteGateway,
  view: initialView
}: {
  gateway: SitesOverviewGateway;
  guide?: boolean;
  onNavigate?: (page: "sites.guide" | "sites.overview" | "sites.sites" | "sites.studio") => void;
  siteGateway?: SiteGateway;
  view?: SitesView;
}) {
  const overview = useSitesOverview(gateway);
  const [internalView, setInternalView] = useState<SitesView>(
    initialView ?? (guide ? "guide" : "studio")
  );

  const activeView = initialView ?? internalView;

  // Fallback dummy gateway if siteGateway is not provided
  const fallbackSiteGateway: SiteGateway = {
    create: async () => {
      throw new Error("Client gateway not connected");
    },
    delete: async (uuid) => ({ deleted: true, uuid }),
    get: async () => {
      throw new Error("Client gateway not connected");
    },
    list: async () => [
      {
        createdAt: new Date().toISOString(),
        description: "Flagship corporate engineering and technology portfolio site.",
        id: 1,
        name: "CODEXSUN",
        port: 7130,
        primaryDomain: "codexsun.com",
        publishedPages: 4,
        slug: "codexsun",
        status: "active",
        themeKey: "portfolio-codexsun",
        updatedAt: new Date().toISOString(),
        uuid: "c0de0001"
      },
      {
        createdAt: new Date().toISOString(),
        description: "Enterprise operations, ERP, and integration solutions portfolio.",
        id: 2,
        name: "LogicX ERP",
        port: 7131,
        primaryDomain: "logicx.in",
        publishedPages: 1,
        slug: "logicx",
        status: "active",
        themeKey: "portfolio-logicx",
        updatedAt: new Date().toISOString(),
        uuid: "c0de0002"
      },
      {
        createdAt: new Date().toISOString(),
        description: "Technology gear, custom computers, and retail services portfolio.",
        id: 3,
        name: "Tech Media",
        port: 7132,
        primaryDomain: "techmedia.in",
        publishedPages: 1,
        slug: "techmedia",
        status: "active",
        themeKey: "portfolio-techmedia",
        updatedAt: new Date().toISOString(),
        uuid: "c0de0003"
      }
    ],
    restore: async () => {
      throw new Error("Client gateway not connected");
    },
    suspend: async () => {
      throw new Error("Client gateway not connected");
    },
    update: async () => {
      throw new Error("Client gateway not connected");
    }
  };

  const sites = useSites(siteGateway ?? fallbackSiteGateway);

  function switchView(target: SitesView) {
    setInternalView(target);
    if (onNavigate) {
      if (target === "guide") onNavigate("sites.guide");
      else if (target === "portfolios") onNavigate("sites.sites");
      else onNavigate("sites.overview");
    }
  }

  const activeCount = sites.records.filter((s) => s.status === "active").length;
  const totalPages = sites.records.reduce((acc, s) => acc + (s.publishedPages || 1), 0);

  return (
    <section className="space-y-5">
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-slate-950 text-white shadow-sm dark:bg-slate-800">
            <LayoutDashboardIcon className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Site Studio
            </h1>
            <p className="text-xs text-muted-foreground">
              Multi-Client Portfolio CMS & Public Site Hub · Wix / Shopify Style Architecture
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeView === "studio" ? "default" : "outline"}
            size="sm"
            onClick={() => switchView("studio")}
          >
            Studio Dashboard
          </Button>
          <Button
            variant={activeView === "portfolios" ? "default" : "outline"}
            size="sm"
            onClick={() => switchView("portfolios")}
          >
            Client Portfolios ({sites.records.length})
          </Button>
          <Button
            variant={activeView === "guide" ? "default" : "outline"}
            size="sm"
            onClick={() => switchView("guide")}
          >
            Developer Guide
          </Button>
        </div>
      </div>

      {overview.isPending && <Skeleton className="h-20" />}
      {overview.isError && (
        <WorkspaceFormBanner title="Sites session could not be verified">
          <p>{overview.error.message}</p>
          <Button
            disabled={overview.isFetching}
            variant="outline"
            onClick={() => void overview.refetch()}
          >
            <RefreshCw /> Retry
          </Button>
        </WorkspaceFormBanner>
      )}

      {/* Main View Render */}
      {activeView === "portfolios" ? (
        <SiteWorkspace sites={sites} />
      ) : activeView === "guide" ? (
        <Card className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Multi-Port Client Portfolio Guide</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run each client portfolio independently during development with isolated styling and hot module reloading.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">CODEXSUN</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Port 7130</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Corporate engineering, product case rooms, and insights articles.
              </p>
              <div className="mt-3 rounded bg-muted/60 p-2 font-mono text-xs text-foreground">
                npm run dev:sites:codexsun
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">LogicX ERP</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Port 7131</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Connected business systems, Tally integration, and theme selector.
              </p>
              <div className="mt-3 rounded bg-muted/60 p-2 font-mono text-xs text-foreground">
                npm run dev:sites:logicx
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Tech Media</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Port 7132</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Computers, gaming setups, repairs, and hardware collections catalog.
              </p>
              <div className="mt-3 rounded bg-muted/60 p-2 font-mono text-xs text-foreground">
                npm run dev:sites:techmedia
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-md bg-muted/30 p-4 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Source Directory Structure</div>
            <div>
              Client public portfolio files reside in:
              <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                apps/sites/clients/src/clients/
              </code>
            </div>
            <div>
              Shared canvas and document title hooks reside in:
              <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                apps/sites/clients/src/shared/
              </code>
            </div>
          </div>
        </Card>
      ) : (
        /* Studio Dashboard View */
        <div className="space-y-5">
          {/* Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StudioMetric
              caption="Registered client workspaces"
              icon={Globe2Icon}
              title="Client Portfolios"
              value={String(sites.records.length)}
            />
            <StudioMetric
              caption="Ready for live publishing"
              icon={RocketIcon}
              title="Active Portfolios"
              value={String(activeCount)}
            />
            <StudioMetric
              caption="Across all client portals"
              icon={Layers3Icon}
              title="Published Pages"
              value={String(totalPages)}
            />
            <StudioMetric
              caption="Dedicated development ports"
              icon={TerminalIcon}
              title="Live Dev Ports"
              value="7130 - 7132"
            />
          </div>

          {/* Client Portfolios Grid */}
          <div className="rounded-md border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Client Portfolios</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Multi-client portfolio websites powered by Site Studio. Click to open live development port or manage.
                </p>
              </div>
              <Button size="sm" icon={<PlusIcon />} onClick={() => switchView("portfolios")}>
                Add Portfolio
              </Button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sites.records.map((site) => (
                <div
                  className="flex flex-col justify-between rounded-lg border bg-background p-5 transition-shadow hover:shadow-md"
                  key={site.uuid}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid size-10 place-items-center rounded-md bg-muted text-foreground">
                        <Globe2Icon className="size-5" />
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge tone={site.status === "active" ? "green" : "amber"}>
                          {site.status}
                        </StatusBadge>
                        {site.port ? (
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                            :{site.port}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">{site.name}</h3>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {site.primaryDomain}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {site.description || "Portfolio website running on Site Studio."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      {site.publishedPages} {site.publishedPages === 1 ? "page" : "pages"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          sites.select(site.uuid);
                          switchView("portfolios");
                        }}
                      >
                        Manage
                      </Button>
                      {site.port ? (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          icon={<ExternalLinkIcon />}
                        >
                          <a
                            href={`http://127.0.0.1:${site.port}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open :{site.port}
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tenant Session Info Card */}
          {overview.isSuccess ? (
            <Card className="p-5">
              <dl className="grid gap-4 text-xs md:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Tenant Organization</dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {overview.data.tenantName} ({overview.data.tenantCode})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">CMS Operator</dt>
                  <dd className="mt-1 font-semibold text-foreground">{overview.data.actorEmail}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Session Verified At</dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {formatDateTime(overview.data.checkedAt)}
                  </dd>
                </div>
              </dl>
            </Card>
          ) : null}
        </div>
      )}
    </section>
  );
}

function StudioMetric({
  caption,
  icon: Icon,
  title,
  value
}: {
  caption: string;
  icon: typeof Globe2Icon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</div>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-slate-800">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-4 text-xs text-muted-foreground">{caption}</div>
    </div>
  );
}
