import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { Globe2Icon, PlusIcon, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  SiteForm,
  emptySitePayload,
  sitePayloadSchema,
  useSites,
  type SiteGateway
} from "../site/index.js";
import { SiteStudio } from "../site/site.studio.js";
import { SiteRuntimeControls } from "../site/site.runtime-controls.js";
import { SiteWorkspace } from "../site/site.workspace.js";
import { useSitesOverview } from "./overview.hooks.js";
import type { SitesOverviewGateway } from "./overview.services.js";

type SitesView = "guide" | "portfolios" | "studio";

export function SitesOverviewWorkspace(props: Parameters<typeof StudioWorkspace>[0]) {
  return <StudioWorkspace {...props} />;
}

function StudioWorkspace({
  gateway,
  guide = false,
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
  const activeView = initialView ?? (guide ? "guide" : "studio");

  const sites = useSites(siteGateway ?? disconnectedSiteGateway);
  const [managedUuid, setManagedUuid] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptySitePayload);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  async function createPortfolio() {
    setSaving(true);
    setCreateError("");
    try {
      const created = await sites.create(sitePayloadSchema.parse(draft));
      setAdding(false);
      setManagedUuid(created.uuid);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create portfolio.");
    } finally {
      setSaving(false);
    }
  }
  const managedSite = sites.records.find((site) => site.uuid === managedUuid);


  if (managedSite && overview.isSuccess) {
    return (
      <SiteStudio
        key={managedSite.uuid}
        site={managedSite}
        sites={sites}
        gateway={siteGateway}
        onBack={() => setManagedUuid(null)}
      />
    );
  }

  return (
    <section className="space-y-5">
      {adding ? (
        <>
          <SiteForm
            draft={draft}
            error={createError}
            saving={saving}
            onChange={setDraft}
            onCancel={() => setAdding(false)}
            onSave={() => void createPortfolio()}
          />
          {createError ? (
            <div className="fixed bottom-6 left-1/2 z-[60] w-[90%] max-w-xl -translate-x-1/2">
              <WorkspaceFormBanner title="Portfolio could not be created">
                {createError}
              </WorkspaceFormBanner>
            </div>
          ) : null}
        </>
      ) : null}
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

      {sites.error ? (
        <WorkspaceFormBanner title="Portfolios could not be loaded">
          <p>{sites.error}</p>
          <Button variant="outline" onClick={() => void sites.refresh()}>
            Retry
          </Button>
        </WorkspaceFormBanner>
      ) : null}
      {sites.loading ? <Skeleton className="h-48" /> : null}
      {/* Main View Render */}
      {overview.isSuccess && !sites.loading && !sites.error ? (
        activeView === "portfolios" ? (
          <SiteWorkspace sites={sites} />
        ) : activeView === "guide" ? (
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Multi-Port Client Portfolio Guide
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Run each client portfolio independently during development with isolated styling and
                hot module reloading.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                  <span className="font-semibold text-foreground">Ramutex</span>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Port 7132</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ramutex client portfolio and development site.
                </p>
                <div className="mt-3 rounded bg-muted/60 p-2 font-mono text-xs text-foreground">
                  npm run dev:ramutex -w @codexsun/sites-clients
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
            {/* Client Portfolios Grid */}
            <div className="rounded-md border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Client Portfolios</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Multi-client portfolio websites powered by Site Studio. Click to open live
                    development port or manage.
                  </p>
                </div>
                <Button
                  size="sm"
                  icon={<PlusIcon />}
                  onClick={() => {
                    setDraft({
                      ...emptySitePayload,
                      port: Math.max(7132, ...sites.records.map((site) => site.port)) + 1
                    });
                    setCreateError("");
                    setAdding(true);
                  }}
                >
                  Add Portfolio
                </Button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                            setManagedUuid(site.uuid);
                          }}
                        >
                          Manage
                        </Button>
                        <SiteRuntimeControls
                          key={`${site.uuid}:${site.port}`}
                          site={site}
                          gateway={siteGateway}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : null}
    </section>
  );
}

const disconnected = async (): Promise<never> => {
  throw new Error("Sites API is not connected.");
};
const disconnectedSiteGateway: SiteGateway = {
  create: disconnected,
  delete: disconnected,
  get: disconnected,
  list: disconnected,
  restore: disconnected,
  suspend: disconnected,
  update: disconnected
};
