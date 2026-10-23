import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useMarketingTransport } from "../../transport";
import type { ConnectionRecord } from "./connection.types";

type Health = {
  connected: boolean;
  accountId: string;
  capabilities: string[];
  expiresAt: string | null;
};

export function ConnectionAuthorizationPanel({ record }: { record: ConnectionRecord }) {
  const api = useMarketingTransport(),
    client = useQueryClient();
  const health = useQuery({
    queryKey: ["marketing", api.scopeKey, "connection-health", record.uuid],
    queryFn: () => api.get<Health>("/marketing/connections/" + record.uuid + "/health")
  });
  const connect = useMutation({
    mutationFn: () =>
      api.post<{ url: string }>("/marketing/connections/" + record.uuid + "/oauth/begin", {}),
    onSuccess: (result) => {
      window.location.assign(result.url);
    }
  });
  const disconnect = useMutation({
    mutationFn: () => api.post("/marketing/connections/" + record.uuid + "/disconnect", {}),
    onSuccess: () => client.invalidateQueries({ queryKey: ["marketing", api.scopeKey] })
  });
  return (
    <section className="space-y-3 border-t p-4">
      <h3 className="font-medium">Provider connection</h3>
      <p className="text-sm">{health.data?.connected ? "Authorized" : "Not authorized"}</p>
      <p className="text-xs text-muted-foreground">
        {health.data?.capabilities.join(", ") || "No verified API capabilities."}
      </p>
      {health.error || connect.error || disconnect.error ? (
        <WorkspaceFormBanner title="Connection requires attention" tone="error">
          {health.error?.message || connect.error?.message || disconnect.error?.message}
        </WorkspaceFormBanner>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void health.refetch()}>
          Refresh status
        </Button>
        {record.provider === "google" ? (
          <Button
            disabled={connect.isPending || record.status !== "active"}
            onClick={() => connect.mutate()}
          >
            {health.data?.connected ? "Reconnect Google" : "Connect Google"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            API authorization is pending for this provider. Use its native tools.
          </p>
        )}
        {health.data?.accountId ? (
          <Button
            variant="outline"
            disabled={disconnect.isPending}
            onClick={() => {
              if (window.confirm("Disconnect this account from this application?"))
                disconnect.mutate();
            }}
          >
            Disconnect
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function ConnectionAuthorizationCallback() {
  const api = useMarketingTransport();
  const [callback] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    return {
      state: query.get("state") ?? "",
      code: query.get("code") ?? "",
      error: query.get("error") ?? ""
    };
  });
  const [selected, setSelected] = useState("");
  const uuid = callback.state.split(".")[0] ?? "";
  const verify = useMutation({
    mutationFn: () =>
      api.post<{ accounts: { id: string; label: string }[] }>(
        "/marketing/connections/" + uuid + "/oauth/complete",
        { state: callback.state, code: callback.code }
      ),
    onSuccess: () => {
      window.history.replaceState({}, "", "/app/marketing/connections");
    }
  });
  const save = useMutation({
    mutationFn: () =>
      api.post("/marketing/connections/" + uuid + "/oauth/select", {
        state: callback.state,
        accountId: selected
      }),
    onSuccess: () => window.location.assign("/app/marketing/connections")
  });
  if (!callback.state && !callback.error) return null;
  return (
    <section className="space-y-3 rounded-md border p-4">
      <h2 className="font-semibold">Complete provider connection</h2>
      {callback.error || verify.error || save.error ? (
        <WorkspaceFormBanner title="Authorization did not complete" tone="error">
          {callback.error || verify.error?.message || save.error?.message}
        </WorkspaceFormBanner>
      ) : null}
      {!verify.data ? (
        <Button
          disabled={!/^[a-f0-9]{8}$/.test(uuid) || !callback.code || verify.isPending}
          onClick={() => verify.mutate()}
        >
          Verify authorization
        </Button>
      ) : (
        <>
          <WorkspaceLookup
            ariaLabel="Verified provider account"
            allowTextValue={false}
            value={selected}
            onValueChange={setSelected}
            options={verify.data.accounts.map((row) => ({ value: row.id, label: row.label }))}
          />
          <Button disabled={!selected || save.isPending} onClick={() => save.mutate()}>
            Use selected account
          </Button>
        </>
      )}
    </section>
  );
}
