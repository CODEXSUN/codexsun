import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace";
import { toast } from "sonner";
import type { EcommerceStorefrontRuntime } from "./overview.types";

export type EcommerceStorefrontRuntimeGateway = {
  status: () => Promise<EcommerceStorefrontRuntime>;
  start: () => Promise<EcommerceStorefrontRuntime>;
};

export function EcommerceStorefrontControls({
  gateway
}: {
  gateway: EcommerceStorefrontRuntimeGateway;
}) {
  const client = useQueryClient();
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(window.location.hostname);
  const key = ["ecommerce", "storefront-runtime"];
  const runtime = useQuery({
    queryKey: key,
    queryFn: gateway.status,
    enabled: local,
    refetchInterval: (query) => (query.state.data?.state === "starting" ? 1000 : 10_000),
    retry: false
  });
  const start = useMutation({
    mutationFn: gateway.start,
    onSuccess: (data) => client.setQueryData(key, data),
    onError: (error) => toast.error(error.message)
  });
  if (!local) return null;
  if (runtime.isPending)
    return <span className="text-xs text-muted-foreground">Checking storefront…</span>;
  if (runtime.isError)
    return (
      <Button size="sm" variant="outline" onClick={() => void runtime.refetch()}>
        Retry storefront status
      </Button>
    );
  if (runtime.data.state === "running") {
    return (
      <a
        href={`${window.location.protocol}//${window.location.hostname}:${runtime.data.port}/shop`}
        target="_blank"
        rel="noreferrer"
        aria-label="Storefront live, open storefront"
      >
        <WorkspaceStatusBadge tone="success" label="Storefront live" />
      </a>
    );
  }
  if (runtime.data.state === "unavailable")
    return <span className="text-xs text-muted-foreground">Storefront controls unavailable</span>;
  if (runtime.data.state === "unhealthy")
    return (
      <div
        className="flex items-center gap-2"
        title="The storefront page or its tenant API is not responding successfully."
      >
        <WorkspaceStatusBadge tone="danger" label="Storefront unavailable" />
        <Button
          size="sm"
          variant="outline"
          disabled={runtime.isFetching}
          onClick={() => void runtime.refetch()}
        >
          Recheck
        </Button>
      </div>
    );
  const starting = start.isPending || runtime.data.state === "starting";
  return (
    <Button size="sm" variant="outline" disabled={starting} onClick={() => start.mutate()}>
      {starting ? "Starting storefront…" : "Start storefront"}
    </Button>
  );
}
