import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  executeTransfer,
  listRuns,
  listSources,
  listTables,
  listTenants,
  previewTransfer,
  type MigrationPreview,
  type MigrationRun,
  type SourceOption,
  type TenantOption
} from "./migration.services.js";
import { RunHistory } from "./migration.list.js";

export function DataMigrationWorkspace({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [runs, setRuns] = useState<MigrationRun[]>([]);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [table, setTable] = useState("");
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([listTenants(), listRuns(), listSources()])
      .then(([available, history, connections]) => {
        setTenants(available);
        setRuns(history);
        setSources(connections);
      })
      .catch((reason: unknown) => setError(message(reason)));
  }, []);

  useEffect(() => {
    setTables([]);
    setTable("");
    setPreview(null);
    if (!source) return;
    let active = true;
    void listTables(Number(source))
      .then((items) => {
        if (active) setTables(items);
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [source]);

  const selection = { sourceId: Number(source), targetTenantId: Number(target), table };
  const canPreview = Boolean(source && target && table);
  const canCopy = preview?.compatible && preview.targetRows === 0 && preview.sourceRows <= 10000;

  async function inspect() {
    if (!canPreview) return;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      setPreview(await previewTransfer(selection));
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (
      !canCopy ||
      !window.confirm(
        `Copy ${preview.sourceRows} rows from ${table} to the empty destination table?`
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await executeTransfer(selection);
      toast.success(`${result.copiedRows} rows copied.`);
      setRuns(await listRuns());
      setPreview(null);
    } catch (reason) {
      setError(message(reason));
      setRuns(await listRuns().catch(() => runs));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspacePage
      title="Migration"
      description="Copy one matching table from an external MariaDB database to a CODEXSUN tenant."
    >
      {sources.every((item) => !item.database) ? (
        <p className="text-sm text-muted-foreground">
          Save an external connection and select its database in Migration Settings before starting
          a transfer.
        </p>
      ) : null}
      <section className="rounded-md border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="External source"
            value={source}
            onChange={setSource}
            options={sources
              .filter((item) => item.database)
              .map((item) => ({ label: item.label, value: String(item.id) }))}
          />
          <Field
            label="Destination tenant"
            value={target}
            onChange={(value) => {
              setTarget(value);
              setPreview(null);
            }}
            options={tenants.map((item) => ({ label: item.label, value: String(item.id) }))}
          />
          <Field
            label="Table"
            value={table}
            onChange={(value) => {
              setTable(value);
              setPreview(null);
            }}
            options={tables.map((name) => ({ label: name, value: name }))}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-5">
          <Button type="button" variant="outline" onClick={onOpenSettings}>
            Migration Settings
          </Button>
          <Button disabled={!canPreview || busy} onClick={() => void inspect()}>
            Preview
          </Button>
          <Button disabled={!canCopy || busy} onClick={() => void copy()} variant="outline">
            Copy rows
          </Button>
        </div>
      </section>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {preview ? (
        <section className="rounded-md border bg-card p-5">
          <h2 className="text-base font-semibold">Transfer preview</h2>
          <p className="pt-2 text-sm">
            Source: {preview.sourceRows} rows · Destination: {preview.targetRows} rows
          </p>
          <p className="pt-1 text-sm text-muted-foreground">
            {preview.reason ??
              (preview.targetRows === 0
                ? "Columns match. Destination is empty."
                : "Destination must be empty.")}
          </p>
          {preview.sourceRows > 10000 ? (
            <p className="pt-1 text-sm text-destructive">
              This table exceeds the 10,000 row limit.
            </p>
          ) : null}
        </section>
      ) : null}
      <RunHistory runs={runs} sources={sources} tenants={tenants} />
    </WorkspacePage>
  );
}

function Field({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <WorkspaceSelect
        ariaLabel={label}
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={`Select ${label.toLowerCase()}`}
      />
    </label>
  );
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Migration failed.";
}
