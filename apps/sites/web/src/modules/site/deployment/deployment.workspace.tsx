import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace";
import { useDeployment } from "./deployment.hooks.js";
import { DeploymentList } from "./deployment.list.js";
import type { DeploymentGateway } from "./deployment.types.js";
export function DeploymentWorkspace({
  uuid,
  gateway
}: {
  uuid: string;
  gateway: DeploymentGateway | undefined;
}) {
  const { state, error, busy, load, retry } = useDeployment(uuid, gateway);
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-semibold">Live publishing · Tirupur Connect</h2>
          <p className="text-sm text-muted-foreground">
            Save a draft, then Publish. Approved content is delivered to tirupurconnect.com
            automatically.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="https://tirupurconnect.com" target="_blank" rel="noreferrer">
            View live site ↗
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh status
        </Button>
      </div>
      {error ? <WorkspaceFormBanner title="Deployment status">{error}</WorkspaceFormBanner> : null}
      {!state ? (
        <p className="text-sm text-muted-foreground">Checking live publishing…</p>
      ) : (
        <>
          {!state.enabled ? (
            <p role="status" className="text-sm text-muted-foreground">
              Direct publishing is not configured for this tenant and client. Publication remains
              saved in Sites.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-sm text-muted-foreground">Latest delivery</span>
              <div className="flex gap-2 items-center">
                <strong>
                  {state.latest ? `Version ${state.latest.version}` : "No deployment yet"}
                </strong>
                {state.latest ? (
                  <StatusBadge
                    tone={
                      state.latest.status === "live"
                        ? "green"
                        : state.latest.status === "failed"
                          ? "red"
                          : "blue"
                    }
                  >
                    {state.latest.status}
                  </StatusBadge>
                ) : null}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Last live version</span>
              <p className="font-semibold">
                {state.lastLive
                  ? `Version ${state.lastLive.version} · ${formatDateTime(state.lastLive.deployedAt!)}`
                  : "Not published to the live site yet"}
              </p>
            </div>
          </div>
          {state.latest?.error ? (
            <WorkspaceFormBanner title="Delivery failed">
              {state.latest.error}
              <Button
                disabled={busy}
                variant="outline"
                size="sm"
                onClick={() => void retry(state.latest!.uuid)}
              >
                Retry delivery
              </Button>
            </WorkspaceFormBanner>
          ) : null}
          {state.history.length ? (
            <details>
              <summary className="cursor-pointer text-sm font-medium">Recent publications</summary>
              <div className="mt-3">
                <DeploymentList history={state.history} />
              </div>
            </details>
          ) : null}
        </>
      )}
    </Card>
  );
}
