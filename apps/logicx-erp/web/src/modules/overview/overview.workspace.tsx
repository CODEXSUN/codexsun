import { formatDateTime as formatWorkspaceDateTime } from "@codexsun/ui/workspace";
import { Boxes, LayoutGrid, PackageOpen, RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useLogicxErpOverview } from "./overview.hooks";
import type { LogicxErpOverviewGateway } from "./overview.services";
import type { LogicxErpOverview } from "./overview.types";

export function LogicxErpOverviewWorkspace({ gateway }: { gateway: LogicxErpOverviewGateway }) {
  const overview = useLogicxErpOverview(gateway);

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <div className="relative min-h-40 p-5 md:p-6">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-orange-100 via-amber-50 to-transparent md:block" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-md bg-orange-600 text-white">
                <Boxes className="size-7" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-muted-foreground">LogicX ERP</p>
                <h1 className="mt-1 text-3xl font-semibold">LogicX ERP Desk</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  The tenant workspace for LogicX ERP operations. Business modules join the side
                  menu as their database and permission contracts are delivered.
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-900">
              <LayoutGrid className="size-4" />
              {overview.isSuccess ? "Workspace connected" : "Workspace foundation ready"}
            </span>
          </div>
        </div>
      </div>

      {overview.isError ? (
        <WorkspaceFormBanner title="LogicX ERP overview could not be loaded">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{overview.error.message}</span>
            <Button
              disabled={overview.isFetching}
              onClick={() => void overview.refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        </WorkspaceFormBanner>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Workspace status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live context returned by the LogicX ERP API for this session.
          </p>
        </div>
        {overview.isPending ? (
          <div className="grid gap-4 p-5 md:grid-cols-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : overview.isSuccess ? (
          <OverviewStatus overview={overview.data} />
        ) : (
          <p className="px-5 py-4 text-sm text-muted-foreground">Status is unavailable.</p>
        )}
      </Card>

      <Card className="flex flex-col items-center gap-3 px-5 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-md bg-orange-50 text-orange-700">
          <PackageOpen className="size-6" />
        </span>
        <h2 className="font-semibold">No ERP modules yet</h2>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          LogicX ERP is enabled for this tenant. Modules added to this app will appear here and in
          the side menu.
        </p>
      </Card>
    </section>
  );
}

function OverviewStatus({ overview }: { overview: LogicxErpOverview }) {
  const items = [
    ["Tenant", `${overview.tenantName} (${overview.tenantCode})`],
    ["Signed in as", overview.actorEmail],
    ["Last checked", formatWorkspaceDateTime(overview.checkedAt)]
  ] as const;

  return (
    <dl className="grid md:grid-cols-3">
      {items.map(([label, value]) => (
        <div
          className="border-b px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
          key={label}
        >
          <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
          <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
