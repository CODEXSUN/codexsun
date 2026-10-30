import { formatDateTime as formatWorkspaceDateTime } from "@codexsun/ui/workspace";
import { RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useEcommerceOverview } from "./overview.hooks";
import type { EcommerceOverviewGateway } from "./overview.services";
export function EcommerceOverviewWorkspace({
  gateway,
  onOpenDesk
}: {
  gateway: EcommerceOverviewGateway;
  onOpenDesk?: () => void;
}) {
  const overview = useEcommerceOverview(gateway);
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ecommerce Desk</h1>
        {onOpenDesk ? <Button onClick={onOpenDesk}>Open ecommerce desk</Button> : null}
      </div>
      {overview.isPending ? <Skeleton className="h-24" /> : null}
      {overview.isError ? (
        <WorkspaceFormBanner title="Ecommerce could not be loaded">
          <p>{overview.error.message}</p>
          <Button
            disabled={overview.isFetching}
            onClick={() => void overview.refetch()}
            variant="outline"
          >
            <RefreshCw />
            Retry
          </Button>
        </WorkspaceFormBanner>
      ) : null}
      {overview.isSuccess ? (
        <Card className="p-5">
          <dl className="grid gap-4 md:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Tenant</dt>
              <dd>
                {overview.data.tenantName} ({overview.data.tenantCode})
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Signed in as</dt>
              <dd>{overview.data.actorEmail}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Last checked</dt>
              <dd>{formatWorkspaceDateTime(overview.data.checkedAt)}</dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </section>
  );
}
