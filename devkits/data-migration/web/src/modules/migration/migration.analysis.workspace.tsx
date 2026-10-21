import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  analyzeMigration,
  migrateSavedPlan,
  readMigrationPlan,
  listSources,
  listTenants,
  type MigrationAnalysis,
  type SourceOption,
  type TenantOption
} from "./migration.services.js";

export type MigrationStartSelection = {
  sourceId: number;
  targetTenantId: number;
  table: string;
};

export function DataMigrationAnalysisWorkspace({
  onOpenMigration
}: {
  onOpenMigration: (selection: MigrationStartSelection) => void;
}) {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [targetTenantId, setTargetTenantId] = useState("");
  const [analysis, setAnalysis] = useState<MigrationAnalysis | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedPlan, setSavedPlan] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([listSources(), listTenants()])
      .then(([availableSources, availableTenants]) => {
        if (!active) return;
        setSources(availableSources.filter((item) => item.database));
        setTenants(availableTenants);
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, []);

  async function inspect() {
    if (!sourceId || !targetTenantId) return;
    setBusy(true);
    setError("");
    setAnalysis(null);
    try {
      const selection = { sourceId: Number(sourceId), targetTenantId: Number(targetTenantId) };
      const [result, plan] = await Promise.all([
        analyzeMigration(selection),
        readMigrationPlan(selection)
      ]);
      setAnalysis(result);
      setSavedPlan(plan.map((item) => item.table));
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function migrate() {
    if (
      !analysis ||
      !window.confirm(
        `Run the saved plan for ${analysis.source.database} into ${analysis.target.database}?`
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await migrateSavedPlan({
        sourceId: Number(sourceId),
        targetTenantId: Number(targetTenantId)
      });
      toast.success(
        `Migration completed: ${result.completed.length} tables and ${result.copiedRows} rows.`
      );
      await inspect();
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspacePage
      title="Migration Analysis"
      description="Compare source and destination tables, schemas, existing keys, and dependencies before copying."
    >
      <section className="grid gap-4 rounded-md border bg-card p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field
          label="Source database"
          value={sourceId}
          onChange={(value) => {
            setSourceId(value);
            setAnalysis(null);
          }}
          options={sources.map((item) => ({
            label: `${item.label} · ${item.database}`,
            value: String(item.id)
          }))}
        />
        <Field
          label="Target tenant"
          value={targetTenantId}
          onChange={(value) => {
            setTargetTenantId(value);
            setAnalysis(null);
          }}
          options={tenants.map((item) => ({ label: item.label, value: String(item.id) }))}
        />
        <Button disabled={!sourceId || !targetTenantId || busy} onClick={() => void inspect()}>
          {busy ? "Analyzing…" : "Analyze databases"}
        </Button>
      </section>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {analysis ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Source rows" value={analysis.summary.sourceRows} />
            <Metric label="New rows" value={analysis.summary.newRows} />
            <Metric label="Exact matches" value={analysis.summary.exactRows} />
            <Metric label="Conflicting rows" value={analysis.summary.conflictingRows} />
            <Metric label="Ready tables" value={analysis.summary.ready} />
          </section>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-4">
            <p className="text-sm">
              Saved mappings: {savedPlan.length} /{" "}
              {analysis.tables.filter((item) => item.status !== "excluded").length} tables
            </p>
            <Button
              disabled={
                busy ||
                savedPlan.length !==
                  analysis.tables.filter((item) => item.status !== "excluded").length
              }
              onClick={() => void migrate()}
            >
              {busy ? "Running migration…" : "Preflight and migrate all tables"}
            </Button>
          </section>
          {analysis.summary.blocked || analysis.summary.review ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
              Copy is blocked for tables with schema, key, or dependency issues. Existing
              destination rows are preserved. Resolve the listed issues and analyze again before
              copying.
            </p>
          ) : null}
          <section className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">New</th>
                  <th className="px-4 py-3">Exact</th>
                  <th className="px-4 py-3">Conflicts</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Mapping</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analysis.tables.map((item) => (
                  <tr key={item.table}>
                    <td className="px-4 py-3 font-medium">{item.table}</td>
                    <td className="px-4 py-3 tabular-nums">{item.sourceRows}</td>
                    <td className="px-4 py-3 tabular-nums">{item.targetRows}</td>
                    <td className="px-4 py-3 tabular-nums">{item.newRows ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{item.exactRows ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{item.conflictingRows ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{item.status.replaceAll("-", " ")}</td>
                    <td className="max-w-[28rem] px-4 py-3 text-muted-foreground">
                      {item.reason ??
                        (item.dependencies.length
                          ? `Requires ${item.dependencies.join(", ")}`
                          : "—")}
                    </td>
                    <td className="px-4 py-3">
                      {item.status !== "excluded" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onOpenMigration({
                              sourceId: Number(sourceId),
                              targetTenantId: Number(targetTenantId),
                              table: item.table
                            })
                          }
                        >
                          {savedPlan.includes(item.table) ? "Edit mapping" : "Map fields"}
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="pt-1 text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Database analysis failed.";
}
