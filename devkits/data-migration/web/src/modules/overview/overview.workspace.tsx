import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  RunHistory,
  listRuns,
  listTenants,
  listSources,
  type MigrationRun
} from "../migration/index.js";
import type { SourceOption, TenantOption } from "../migration/migration.services.js";

export function DataMigrationOverview({ onOpenMigration }: { onOpenMigration: () => void }) {
  const [runs, setRuns] = useState<MigrationRun[]>([]);
  const [tenantCount, setTenantCount] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([listRuns(), listTenants(), listSources()])
      .then(([history, tenants, sources]) => {
        if (!active) return;
        setRuns(history);
        setTenantCount(tenants.length);
        setSourceCount(sources.length);
        setTenants(tenants);
        setSources(sources);
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <WorkspacePage
      title="Data Migration"
      description="Review external MariaDB to CODEXSUN transfers."
      actions={<Button onClick={onOpenMigration}>New migration</Button>}
    >
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading migration activity…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Metric label="External sources" value={sourceCount} />
            <Metric label="Destination tenants" value={tenantCount} />
            <Metric
              label="Completed runs"
              value={runs.filter((run) => run.status === "completed").length}
            />
            <Metric
              label="Failed runs"
              value={runs.filter((run) => run.status === "failed").length}
            />
          </div>
          <RunHistory runs={runs.slice(0, 10)} sources={sources} tenants={tenants} />
        </>
      )}
    </WorkspacePage>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="pt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Could not load migrations.";
}
