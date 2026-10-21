import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import {
  createJob,
  renameJob,
  listJobs,
  listRuns,
  listSources,
  listTables,
  listTenants,
  getTableSchema,
  previewTransfer,
  saveJobTablePair,
  runMigrationJob,
  readJobTables,
  listTenantTables,
  type MigrationColumnMapping,
  type MigrationTableSchema,
  type MigrationPreview,
  type MigrationRun,
  type MigrationJob,
  type SavedTableMapping,
  type SourceOption,
  type TenantOption
} from "./migration.services.js";
import { RunHistory } from "./migration.list.js";

export function DataMigrationWorkspace({
  initialSelection
}: {
  initialSelection?: { sourceId: number; targetTenantId: number; table: string } | undefined;
}) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [targetTables, setTargetTables] = useState<string[]>([]);
  const [jobTables, setJobTables] = useState<SavedTableMapping[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [runs, setRuns] = useState<MigrationRun[]>([]);
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [activeStep, setActiveStep] = useState<"sessions" | "tables" | "fields" | "field-editor">("sessions");
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [jobId, setJobId] = useState("");
  const [sourceTenant, setSourceTenant] = useState("");
  const [targetDatabase, setTargetDatabase] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [table, setTable] = useState("");
  const [targetTable, setTargetTable] = useState("");
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [schema, setSchema] = useState<MigrationTableSchema | null>(null);
  const [columnMappings, setColumnMappings] = useState<MigrationColumnMapping[]>([]);
  const [selectedSourceColumn, setSelectedSourceColumn] = useState("");
  const [selectedTargetColumn, setSelectedTargetColumn] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialSelection) {
      setSource(String(initialSelection.sourceId));
      setTarget(String(initialSelection.targetTenantId));
    }
    void Promise.all([
      listTenants()
        .then(setTenants)
        .catch((reason: unknown) => setError(message(reason))),
      listRuns()
        .then(setRuns)
        .catch((reason: unknown) => setError(message(reason))),
      listSources()
        .then(setSources)
        .catch((reason: unknown) => setError(message(reason))),
      listJobs()
        .then(setJobs)
        .catch((reason: unknown) => setError(message(reason)))
    ]);
  }, [initialSelection]);

  useEffect(() => {
    if (
      !initialSelection ||
      target !== String(initialSelection.targetTenantId) ||
      targetDatabase
    ) return;
    const database = tenants.find((item) => item.id === initialSelection.targetTenantId)?.database;
    if (database && sources.some((item) => item.database === database)) {
      setTargetDatabase(database);
    }
  }, [initialSelection, target, targetDatabase, tenants, sources]);

  useEffect(() => {
    setTables([]);
    setTable("");
    setPreview(null);
    if (!source) {
      setTablesLoading(false);
      return;
    }
    let active = true;
    setTablesLoading(true);
    void listTables(Number(source))
      .then((items) => {
        if (active) {
          setTables(items);
          if (initialSelection?.table && items.includes(initialSelection.table)) {
            setTable(initialSelection.table);
          }
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      })
      .finally(() => {
        if (active) setTablesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [source, initialSelection?.table]);

  useEffect(() => {
    setTargetTables([]);
    setTargetTable("");
    if (!target) return;
    let active = true;
    void listTenantTables(Number(target))
      .then((items) => {
        if (!active) return;
        setTargetTables(items);
        if (table && items.includes(table)) setTargetTable(table);
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [target, table]);

  useEffect(() => {
    setJobTables([]);
    if (!jobId) return;
    let active = true;
    void readJobTables(jobId)
      .then((saved) => {
        if (!active) return;
        setJobTables(saved);
        if (!table && saved[0]) {
          setTable(saved[0].sourceTable ?? saved[0].table);
          setTargetTable(saved[0].targetTable ?? saved[0].table);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [jobId, table]);

  useEffect(() => {
    setSchema(null);
    setColumnMappings([]);
    setSelectedSourceColumn("");
    setSelectedTargetColumn("");
    setPreview(null);
    if (!source || !target || !table || !targetTable) return;
    let active = true;
    const selection = {
      sourceId: Number(source),
      targetTenantId: Number(target),
      table,
      targetTable
    };
    void Promise.all([
      getTableSchema(selection),
      jobId ? readJobTables(jobId) : Promise.resolve([])
    ])
      .then(([result, plan]) => {
        if (!active) return;
        setSchema(result);
        setJobTables(plan);
        const saved = plan.find(
          (item) => item.sourceTable === table || item.table === table
        )?.columnMappings;
        setColumnMappings(
          saved ??
            result.sourceColumns.map((sourceColumn) => ({
              sourceColumn: sourceColumn.name,
              targetColumn: result.targetColumns.some((column) => column.name === sourceColumn.name)
                ? sourceColumn.name
                : ""
            }))
        );
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [source, target, table, targetTable, jobId]);

  const selection = {
    sourceId: Number(source),
    targetTenantId: Number(target),
    table,
    targetTable
  };
  const mappedTargets = new Set(
    columnMappings.map((mapping) => mapping.targetColumn).filter(Boolean)
  );
  const requiredUnmapped = schema?.targetColumns.some(
    (column) => column.required && !mappedTargets.has(column.name)
  );
  const canPreview = Boolean(
    source &&
    target &&
    table &&
    targetTable &&
    schema &&
    columnMappings.length === schema.sourceColumns.length &&
    columnMappings.every((mapping) => mapping.targetColumn) &&
    !requiredUnmapped
  );
  const canRunJob = Boolean(
    jobId &&
    tables.length > 0 &&
    tables.every((name) =>
      jobTables.some((item) => item.sourceTable === name && item.mappingStatus === "mapped")
    )
  );
  const targetDatabaseOptions = sources
    .filter((item) => item.database)
    .map((item) => ({
      label: `${item.database} · ${item.label}`,
      value: item.database
    }))
    .filter(
      (option, index, options) =>
        options.findIndex((candidate) => candidate.value === option.value) === index
    );
  const selectedTargetTenant = tenants.find((item) => item.id === Number(target));
  const targetDatabaseMatchesTenant = Boolean(
    selectedTargetTenant?.database && selectedTargetTenant.database === targetDatabase
  );

  async function inspect() {
    if (!canPreview) return;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      setPreview(await previewTransfer({ ...selection, columnMappings }));
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function runJob() {
    if (!canRunJob || !jobId) return;
    const name = jobs.find((item) => item.id === jobId)?.sessionName ?? sessionName;
    if (
      !window.confirm(
        `Migrate all mapped tables in “${name}”? Every destination table must be empty.`
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await runMigrationJob(jobId);
      const [updatedRuns, updatedTables, updatedJobs] = await Promise.all([
        listRuns(),
        readJobTables(jobId),
        listJobs()
      ]);
      setRuns(updatedRuns);
      setJobTables(updatedTables);
      setJobs(updatedJobs);
      toast.success(
        `${result.completed.length} tables migrated · ${result.copiedRows} rows copied.`
      );
    } catch (reason) {
      setError(message(reason));
      const [updatedRuns, updatedTables, updatedJobs] = await Promise.all([
        listRuns().catch(() => runs),
        readJobTables(jobId).catch(() => jobTables),
        listJobs().catch(() => jobs)
      ]);
      setRuns(updatedRuns);
      setJobTables(updatedTables);
      setJobs(updatedJobs);
    } finally {
      setBusy(false);
    }
  }

  async function createMigrationJob() {
    if (!sessionName.trim()) return;
    if (!jobId && (!source || !target || !targetDatabaseMatchesTenant)) return;
    setBusy(true);
    setError("");
    try {
      const created = jobId
        ? await renameJob(jobId, sessionName.trim())
        : await createJob({
            sessionName: sessionName.trim(),
            sourceId: Number(source),
            sourceTenantId: sourceTenant ? Number(sourceTenant) : null,
            targetTenantId: Number(target)
          });
      setJobs(await listJobs());
      setJobId(created.id);
      setSessionDialogOpen(false);
      toast.success(jobId ? "Migration renamed." : `Migration session “${sessionName.trim()}” created.`);
      if (!jobId) setActiveStep("tables");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  function selectJob(id: string) {
    const item = jobs.find((job) => job.id === id);
    if (!item) return;
    setSessionName(item.sessionName);
    setSource(String(item.sourceId));
    setSourceTenant(item.sourceTenantId ? String(item.sourceTenantId) : "");
    setTarget(String(item.targetTenantId));
    setTargetDatabase(item.targetDatabase);
    setJobId(item.id);
    setPreview(null);
  }

  return (
    <WorkspacePage
      title="Migration Mapper"
      description="Create a migration session, add its table pairs, then map fields for each pair."
    >
      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved server connections are available. Add a connection in Database Settings.
        </p>
      ) : sources.every((item) => !item.database) ? (
        <p className="text-sm text-muted-foreground">
          Select a database for a saved server connection in Database Settings before starting a
          transfer.
        </p>
      ) : null}
      {activeStep !== "sessions" ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button type="button" variant="ghost" onClick={() => setActiveStep("sessions")}>Migrations</Button>
          <span className="text-muted-foreground">/</span>
          {activeStep === "fields" || activeStep === "field-editor" ? (
            <Button type="button" variant="ghost" onClick={() => setActiveStep("tables")}>Tables</Button>
          ) : null}
          {activeStep === "fields" || activeStep === "field-editor" ? <span className="text-muted-foreground">/</span> : null}
          {activeStep === "field-editor" ? (
            <Button type="button" variant="ghost" onClick={() => setActiveStep("fields")}>Fields</Button>
          ) : null}
          {activeStep === "field-editor" ? <span className="text-muted-foreground">/</span> : null}
          <span className="font-medium">{jobs.find((item) => item.id === jobId)?.sessionName ?? sessionName}</span>
        </div>
      ) : null}
      <section className={`space-y-4 rounded-md border bg-card p-5 ${activeStep === "sessions" ? "" : "hidden"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Migrations</h2>
            <p className="pt-1 text-sm text-muted-foreground">Migration sessions and their source and target databases.</p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setSessionName("");
              setSource("");
              setSourceTenant("");
              setTarget("");
              setTargetDatabase("");
              setJobId("");
              setSessionDialogOpen(true);
            }}
          >
            New migration
          </Button>
        </div>
        <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{jobId ? "Rename migration" : "New migration session"}</DialogTitle>
              <DialogDescription>
                {jobId ? "Update the migration session name." : "Choose saved source and target databases for this migration."}
              </DialogDescription>
            </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
            Migration name
            <Input
              maxLength={120}
              onChange={(event) => {
                setSessionName(event.target.value);
              }}
              placeholder="e.g. Sukraa job"
              value={sessionName}
            />
          </label>
          {!jobId ? <>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
            Source database
            <WorkspaceLookup
              ariaLabel="Source database"
              allowTextValue={false}
              className="w-full"
              clearable
              compactOptions
              disabled={!sources.some((item) => item.database)}
              onValueChange={(value) => {
                setSource(value);
                setJobId("");
              }}
              options={sources
                .filter((item) => item.database)
                .map((item) => ({
                  label: `${item.database} · ${item.label}`,
                  value: String(item.id)
                }))}
              placeholder="Search and select source database"
              showAllOptionsOnFocus
              value={source}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
            Target database
            <WorkspaceLookup
              ariaLabel="Target database"
              allowTextValue={false}
              className="w-full"
              clearable
              compactOptions
              disabled={!targetDatabaseOptions.length}
              onValueChange={(value) => {
                setTargetDatabase(value);
                const matchingTenant = tenants.find((item) => item.database === value);
                setTarget(matchingTenant ? String(matchingTenant.id) : "");
                setJobId("");
                setPreview(null);
              }}
              options={targetDatabaseOptions}
              placeholder="Search and select target database"
              showAllOptionsOnFocus
              value={targetDatabase}
            />
          </label>
          <Field
            label="Source tenant (optional)"
            value={sourceTenant}
            onChange={(value) => {
              setSourceTenant(value);
              setJobId("");
            }}
            options={tenants.map((item) => ({ label: item.label, value: String(item.id) }))}
          />
          <Field
            label="Target tenant"
            value={target}
            onChange={(value) => {
              setTarget(value);
              const tenant = tenants.find((item) => item.id === Number(value));
              setTargetDatabase(
                tenant?.database && targetDatabaseOptions.some((option) => option.value === tenant.database)
                  ? tenant.database
                  : ""
              );
              setJobId("");
              setPreview(null);
            }}
            options={tenants.map((item) => ({ label: item.label, value: String(item.id) }))}
          />
          </> : null}
        </div>
        {!jobId && targetDatabase && !targetDatabaseMatchesTenant ? (
          <p className="pt-3 text-sm text-destructive">
            Choose a target tenant that uses the selected saved database before saving this session.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            type="button"
            disabled={!sessionName.trim() || (!jobId && (!source || !target || !targetDatabaseMatchesTenant)) || busy}
            onClick={() => void createMigrationJob()}
          >
            {jobId ? "Save changes" : "Create migration"}
          </Button>
        </div>
            <div className="flex justify-end pt-3">
              <Button type="button" variant="outline" onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
        {jobs.length ? (
          <div>
            <h3 className="pb-2 text-sm font-semibold">Saved migrations</h3>
            <WorkspaceTablePanel>
              <div className="workspace-scroll overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <WorkspaceTableHeaderCell>Name</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Source database</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Target database</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Target tenant</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Tables</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Action</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                      onClick={() => {
                        selectJob(item.id);
                        setActiveStep("tables");
                      }}
                    >
                      <td className="px-3 py-2">{item.sessionName}</td>
                      <td className="px-3 py-2">{item.sourceDatabase}</td>
                      <td className="px-3 py-2">{item.targetDatabase}</td>
                      <td className="px-3 py-2">{item.targetLabel}</td>
                      <td className="px-3 py-2">{item.tableCount}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectJob(item.id);
                              setActiveStep("tables");
                            }}
                          >
                            Tables
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectJob(item.id);
                              setSessionDialogOpen(true);
                            }}
                          >
                            Rename
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </WorkspaceTablePanel>
          </div>
        ) : null}
      </section>
      <section className={`space-y-4 rounded-md border bg-card p-5 ${activeStep === "tables" ? "" : "hidden"}`}>
        <div>
          <h2 className="text-base font-semibold">Table mappings</h2>
          <p className="pt-1 text-sm text-muted-foreground">
            {jobs.find((item) => item.id === jobId)?.sessionName ?? sessionName} · pair source and target tables for this migration.
          </p>
        </div>
        <div className="grid gap-4 pt-5 md:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
            Source table
            <WorkspaceLookup
              ariaLabel="Source table"
              allowTextValue={false}
              className="w-full"
              clearable
              compactOptions
              disabled={!source || tablesLoading}
              loading={tablesLoading}
              onValueChange={(value) => {
                setTable(value);
                setTargetTable(targetTables.includes(value) ? value : "");
                setPreview(null);
              }}
              options={tables.map((name) => ({ label: name, value: name }))}
              placeholder={tablesLoading ? "Loading tables…" : "Search and select table"}
              showAllOptionsOnFocus
              value={table}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
            Target table
            <WorkspaceLookup
              ariaLabel="Target table"
              allowTextValue={false}
              className="w-full"
              clearable
              compactOptions
              disabled={!target || !targetTables.length}
              onValueChange={(value) => {
                setTargetTable(value);
                setPreview(null);
              }}
              options={targetTables.map((name) => ({ label: name, value: name }))}
              placeholder="Search and select target table"
              showAllOptionsOnFocus
              value={targetTable}
            />
          </label>
        </div>
        {jobId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <p className="text-xs text-muted-foreground">Generated session ID: {jobId}</p>
            <Button type="button" disabled={!canRunJob || busy} onClick={() => void runJob()}>
              Migrate all mapped tables
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-5">
          <Button disabled={!canPreview || busy} onClick={() => void inspect()}>
            Preview
          </Button>
        </div>
        {jobTables.length ? (
          <div className="pt-5">
            <h3 className="pb-2 text-sm font-semibold">Table mapping child records</h3>
            <WorkspaceTablePanel>
              <div className="workspace-scroll overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <WorkspaceTableHeaderCell>Source table</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Target table</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Source rows</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Target rows</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Mapping status</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Migration status</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Action</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {jobTables.map((item) => (
                    <tr
                      key={item.id ?? item.sourceTable ?? item.table}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-2">{item.sourceTable ?? item.table}</td>
                      <td className="px-3 py-2">{item.targetTable ?? item.table}</td>
                      <td className="px-3 py-2">{item.sourceRows ?? 0}</td>
                      <td className="px-3 py-2">{item.targetRows ?? 0}</td>
                      <td className="px-3 py-2">{item.mappingStatus ?? "mapped"}</td>
                      <td className="px-3 py-2">{item.migrationStatus ?? "pending"}</td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setTable(item.sourceTable ?? item.table);
                            setTargetTable(item.targetTable ?? item.table);
                            setActiveStep("fields");
                          }}
                        >
                          Open fields
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </WorkspaceTablePanel>
          </div>
        ) : null}
      </section>
      {activeStep === "fields" && !schema ? (
        <section className="rounded-md border bg-card p-5">
          <h2 className="font-semibold">Fields</h2>
          <p className="pt-1 text-sm text-muted-foreground">
            Select a migration session, then choose a source and target table on the Table mappings page.
          </p>
          <Button className="mt-4" type="button" variant="outline" onClick={() => setActiveStep("tables")}>
            Open table mappings
          </Button>
        </section>
      ) : null}
      {activeStep === "fields" && schema ? (
        <section className="space-y-4 rounded-md border bg-card p-5">
          <div>
            <h2 className="text-base font-semibold">Field mappings</h2>
            <p className="pt-1 text-sm text-muted-foreground">
              {table} → {targetTable} · select a field mapping to edit it.
            </p>
          </div>
          <WorkspaceTablePanel>
            <div className="workspace-scroll overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <WorkspaceTableHeaderCell>Source field</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Source type</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Destination field</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Mapping status</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Action</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {schema.sourceColumns.map((column) => {
                    const mapping = columnMappings.find((item) => item.sourceColumn === column.name);
                    return (
                      <tr key={column.name} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{column.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{column.type}</td>
                        <td className="px-3 py-2">{mapping?.targetColumn || "Not mapped"}</td>
                        <td className="px-3 py-2">{mapping?.targetColumn ? "Mapped" : "Pending"}</td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedSourceColumn(column.name);
                              setSelectedTargetColumn(mapping?.targetColumn ?? "");
                              setActiveStep("field-editor");
                            }}
                          >
                            Edit mapping
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </WorkspaceTablePanel>
        </section>
      ) : null}
      {activeStep === "field-editor" && schema ? (
        <section className="rounded-md border bg-card p-5">
          <div className="pb-4">
              <h2 className="font-semibold">Edit field mappings</h2>
            <p className="pt-1 text-sm text-muted-foreground">
              Child mapping for {table} → {targetTable}. Select a source field and destination field,
              then map them. Required destination fields must be mapped before import.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <ColumnMappingTable
                title="Source columns"
                columns={schema.sourceColumns}
                selectedColumn={selectedSourceColumn}
                onSelect={(name) => {
                  setSelectedSourceColumn(name);
                  setSelectedTargetColumn(
                    columnMappings.find((item) => item.sourceColumn === name)?.targetColumn ?? ""
                  );
                }}
                mappingFor={(name) =>
                  columnMappings.find((item) => item.sourceColumn === name)?.targetColumn
                }
              />
            </div>
            <div className="flex flex-col items-center gap-2 py-2 lg:mt-12 lg:w-56 lg:shrink-0">
              <span className="text-center text-xs text-muted-foreground">
                {selectedSourceColumn && selectedTargetColumn
                  ? `${selectedSourceColumn} → ${selectedTargetColumn}`
                  : "Select one column on each side"}
              </span>
              <Button
                type="button"
                disabled={!selectedSourceColumn || !selectedTargetColumn || busy}
                onClick={() => {
                  setColumnMappings((current) =>
                    current.map((item) => {
                      if (item.sourceColumn === selectedSourceColumn) {
                        return { ...item, targetColumn: selectedTargetColumn };
                      }
                      return item.targetColumn === selectedTargetColumn
                        ? { ...item, targetColumn: "" }
                        : item;
                    })
                  );
                  setPreview(null);
                }}
              >
                Map
              </Button>
            </div>
            <div className="min-w-0 flex-1">
              <ColumnMappingTable
                title="Destination columns"
                columns={schema.targetColumns}
                selectedColumn={selectedTargetColumn}
                onSelect={setSelectedTargetColumn}
                mappingFor={(name) =>
                  columnMappings.find((item) => item.targetColumn === name)?.sourceColumn
                }
                required
              />
            </div>
          </div>
          {requiredUnmapped ? (
            <p className="pt-3 text-sm text-destructive">
              Map all required destination fields before preview.
            </p>
          ) : null}
          <div className="pt-4">
            <Button
              variant="outline"
              disabled={!canPreview || busy || !jobId}
              onClick={() => {
                setBusy(true);
                void saveJobTablePair(jobId, {
                  sourceTable: table,
                  targetTable,
                  columnMappings
                })
                  .then(async () => {
                    const [savedTables, savedJobs] = await Promise.all([
                      readJobTables(jobId),
                      listJobs()
                    ]);
                    setJobTables(savedTables);
                    setJobs(savedJobs);
                    setColumnMappings(
                      savedTables.find((item) => item.sourceTable === table)?.columnMappings ??
                        columnMappings
                    );
                    setActiveStep("fields");
                    toast.success(`${table} → ${targetTable} mapping saved.`);
                  })
                  .catch((reason: unknown) => setError(message(reason)))
                  .finally(() => setBusy(false));
              }}
            >
              Save mappings
            </Button>
          </div>
          {columnMappings.some((item) => item.id) ? (
            <div className="pt-5">
              <h3 className="pb-2 text-sm font-semibold">Field mapping child records</h3>
              <WorkspaceTablePanel>
                <div className="workspace-scroll overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <WorkspaceTableHeaderCell>Row ID</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Source field</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Destination field</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>By</WorkspaceTableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {columnMappings.map((item, index) => (
                      <tr
                        key={item.id ?? `${item.sourceColumn}-${index}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-2">{item.id ?? "—"}</td>
                        <td className="px-3 py-2">{item.sourceColumn}</td>
                        <td className="px-3 py-2">{item.targetColumn}</td>
                        <td className="px-3 py-2">{item.status ?? "mapped"}</td>
                        <td className="px-3 py-2">{item.by ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </WorkspaceTablePanel>
            </div>
          ) : null}
        </section>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {preview && activeStep === "tables" ? (
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
      {activeStep === "sessions" ? <RunHistory runs={runs} sources={sources} tenants={tenants} /> : null}
    </WorkspacePage>
  );
}

function ColumnMappingTable({
  title,
  columns,
  selectedColumn,
  onSelect,
  mappingFor,
  required = false
}: {
  title: string;
  columns: MigrationTableSchema["sourceColumns"];
  selectedColumn: string;
  onSelect: (name: string) => void;
  mappingFor: (name: string) => string | undefined;
  required?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <WorkspaceTablePanel className="overflow-hidden">
        <div className="workspace-scroll overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell>Select</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Column</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Type</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>
                {required ? "Mapped from" : "Mapped to"}
              </WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => {
              const selected = selectedColumn === column.name;
              const mappedColumn = mappingFor(column.name);
              return (
                <tr
                  key={column.name}
                  className={`border-b last:border-b-0 ${selected ? "bg-accent/60" : ""}`}
                >
                  <td className="px-3 py-2.5">
                    <Checkbox
                      aria-label={`Select ${title.toLowerCase()} ${column.name}`}
                      checked={selected}
                      onCheckedChange={(checked) => onSelect(checked ? column.name : "")}
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelect(column.name)}
                      className="w-full cursor-pointer rounded-sm text-left hover:text-primary"
                    >
                      {column.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {column.type}
                    {column.required ? " · required" : ""}
                    {column.generated ? " · generated" : ""}
                  </td>
                  <td className="max-w-36 truncate px-3 py-2.5 text-xs text-muted-foreground">
                    {mappedColumn ?? "Not mapped"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </WorkspaceTablePanel>
    </div>
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
