import { useEffect, useState } from "react";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
import {
  listBridgeSources,
  listBridgeTenants,
  verifyBridgeConnection
} from "./database-connection.services.js";
import { saveBridgeConnection, useBridgeConnection } from "./database-connection.store.js";
import type { SourceOption, TenantOption } from "./database-connection.types.js";
export function DatabaseConnectionWorkspace({ onManageSources }: { onManageSources: () => void }) {
  const connection = useBridgeConnection();
  const [sources, setSources] = useState<SourceOption[]>([]),
    [tenants, setTenants] = useState<TenantOption[]>([]);
  const [sourceId, setSource] = useState(connection?.sourceId ?? 0),
    [targetId, setTarget] = useState(connection?.targetTenantId ?? 0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.all([listBridgeSources(), listBridgeTenants()])
      .then(([a, b]) => {
        if (active) {
          setSources(a);
          setTenants(b);
        }
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function verify() {
    setBusy(true);
    setError("");
    try {
      saveBridgeConnection(await verifyBridgeConnection(sourceId, targetId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify connections.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspacePage
      title="Database Connection"
      actions={
        <Button variant="outline" onClick={onManageSources}>
          Manage sources
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Source connection
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={sourceId}
            onChange={(e) => setSource(Number(e.target.value))}
          >
            <option value={0}>Select source</option>
            {sources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} · {item.database}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Target tenant
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={targetId}
            onChange={(e) => setTarget(Number(e.target.value))}
          >
            <option value={0}>Select target</option>
            {tenants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} · {item.database}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        className="mt-4"
        disabled={busy || !sourceId || !targetId}
        onClick={() => void verify()}
      >
        {busy ? "Verifying…" : "Verify and save connection"}
      </Button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {connection ? (
        <section className="mt-5 border-t pt-4">
          <h2 className="font-semibold">Verified connection</h2>
          <p className="mt-1 text-sm">
            {connection.sourceDatabase} → {connection.targetDatabase}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this pair in Common Tables, Master Tables, or Billing Tables.
          </p>
        </section>
      ) : null}
    </WorkspacePage>
  );
}
