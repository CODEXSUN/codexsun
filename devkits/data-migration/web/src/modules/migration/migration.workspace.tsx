import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceColumnMenu } from "@codexsun/ui/workspace/filters";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import type { WorkspaceColumnOption } from "@codexsun/ui/workspace/types";
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
  readJobQueryPlan,
  generateJobQueryPlan,
  finalizeJobQueryPlan,
  saveJobTablePair,
  runMigrationJob,
  readJobTables,
  listTenantTables,
  sampleTableData,
  type MigrationColumnMapping,
  type MigrationTableSchema,
  type MigrationPreview,
  type MigrationTableSample,
  type MigrationRun,
  type MigrationJob,
  type MigrationQueryPlan,
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
  const [queryPlan, setQueryPlan] = useState<MigrationQueryPlan | null>(null);
  const [activeStep, setActiveStep] = useState<
    "sessions" | "tables" | "fields" | "field-editor" | "migration"
  >("sessions");
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
  const [mappingPreviewOpen, setMappingPreviewOpen] = useState(false);
  const [compatibilityCheck, setCompatibilityCheck] = useState<MigrationPreview | null>(null);
  const [tableSample, setTableSample] = useState<MigrationTableSample | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleRequested, setSampleRequested] = useState(false);
  const [sampleMappingValues, setSampleMappingValues] = useState<string[] | null>(null);
  const sampleRequestSequence = useRef(0);
  const [schema, setSchema] = useState<MigrationTableSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
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
    if (!initialSelection || target !== String(initialSelection.targetTenantId) || targetDatabase)
      return;
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
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [target]);

  useEffect(() => {
    if (
      initialSelection?.table &&
      table === initialSelection.table &&
      !targetTable &&
      targetTables.includes(initialSelection.table)
    ) {
      setTargetTable(initialSelection.table);
    }
  }, [initialSelection?.table, table, targetTable, targetTables]);

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
    setTableSample(null);
    setSampleRequested(false);
    setSampleMappingValues(null);
    setSampleLoading(false);
    sampleRequestSequence.current += 1;
    if (!source || !target || !table || !targetTable) {
      setSchemaLoading(false);
      return;
    }
    let active = true;
    setSchemaLoading(true);
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
        setError("");
        setSchema(result);
        setJobTables(plan);
        const saved = plan.find(
          (item) => item.sourceTable === table || item.table === table
        )?.columnMappings;
        setColumnMappings(
          saved ??
            result.sourceColumns
              .filter((sourceColumn) =>
                result.targetColumns.some((column) => column.name === sourceColumn.name)
              )
              .map((sourceColumn) => ({
                sourceColumn: sourceColumn.name,
                targetColumn: sourceColumn.name
              }))
        );
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      })
      .finally(() => {
        if (active) setSchemaLoading(false);
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
  const sampleContextKey = JSON.stringify([jobId, source, target, table, targetTable]);
  const sampleFieldMappings = useMemo(
    () => columnMappings.filter((item) => item.sourceColumn && item.targetColumn),
    [columnMappings]
  );
  const sampleColumnOptions = sampleFieldMappings.map((item) => {
    const id = sampleMappingKey(item.sourceColumn, item.targetColumn);
    return {
      id,
      label: `${item.sourceColumn} → ${item.targetColumn}`,
      checked: sampleMappingValues === null || sampleMappingValues.includes(id),
      onCheckedChange: (checked: boolean) =>
        setSampleMappingValues((current) => {
          const selected =
            current ??
            sampleFieldMappings.map((mapping) =>
              sampleMappingKey(mapping.sourceColumn, mapping.targetColumn)
            );
          return checked
            ? [...new Set([...selected, id])]
            : selected.filter((value) => value !== id);
        })
    };
  });
  const selectedSampleFieldMappings = useMemo(
    () =>
      sampleMappingValues === null
        ? null
        : sampleFieldMappings.filter((item) =>
            sampleMappingValues.includes(sampleMappingKey(item.sourceColumn, item.targetColumn))
          ),
    [sampleFieldMappings, sampleMappingValues]
  );
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
    columnMappings.length > 0 &&
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
    try {
      setPreview(await previewTransfer({ ...selection, columnMappings }));
    } catch (reason) {
      setPreview(null);
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  const loadTableSample = useCallback(
    async (sourcePage = 1, targetPage = 1) => {
      if (!source || !target || !table || !targetTable) return;
      const requestSequence = ++sampleRequestSequence.current;
      setSampleLoading(true);
      try {
        const result = await sampleTableData({
          sourceId: Number(source),
          targetTenantId: Number(target),
          table,
          targetTable,
          sourcePage,
          targetPage
        });
        if (requestSequence === sampleRequestSequence.current) setTableSample(result);
      } catch (reason) {
        if (requestSequence === sampleRequestSequence.current) setError(message(reason));
      } finally {
        if (requestSequence === sampleRequestSequence.current) setSampleLoading(false);
      }
    },
    [source, target, table, targetTable]
  );

  useEffect(() => {
    if (!sampleRequested) return;
    void loadTableSample(1, 1);
  }, [sampleRequested, loadTableSample]);

  async function saveCurrentTableMapping() {
    if (!canPreview || !jobId) return;
    setBusy(true);
    setError("");
    try {
      await saveJobTablePair(jobId, {
        sourceTable: table,
        targetTable,
        columnMappings
      });
      const [savedTables, savedJobs] = await Promise.all([readJobTables(jobId), listJobs()]);
      setJobTables(savedTables);
      setJobs(savedJobs);
      setQueryPlan(null);
      setColumnMappings(
        savedTables.find((item) => item.sourceTable === table)?.columnMappings ?? columnMappings
      );
      toast.success(`${table} → ${targetTable} mapping saved.`);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function analyzeTableCompatibility() {
    if (!source || !target || !table || !targetTable || !schema) return;
    setBusy(true);
    setError("");
    setCompatibilityCheck(null);
    try {
      const result = await previewTransfer({ ...selection, columnMappings });
      setCompatibilityCheck(result);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function openMigrationReview() {
    if (!jobId) return;
    setBusy(true);
    setError("");
    try {
      setQueryPlan(await readJobQueryPlan(jobId));
      setActiveStep("migration");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function generateQueryPlan() {
    if (!jobId || !canRunJob) return;
    setBusy(true);
    setError("");
    try {
      setQueryPlan(await generateJobQueryPlan(jobId));
      toast.success("Query plan generated. Review the tables and SQL before finalizing.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function finalizeQueryPlan() {
    if (!jobId || !queryPlan?.canFinalize || queryPlan.status !== "generated") return;
    setBusy(true);
    setError("");
    try {
      setQueryPlan(await finalizeJobQueryPlan(jobId));
      toast.success("Migration plan finalized. The run will verify it again before writing.");
    } catch (reason) {
      setError(message(reason));
      setQueryPlan(await readJobQueryPlan(jobId).catch(() => queryPlan));
    } finally {
      setBusy(false);
    }
  }

  async function runJob() {
    if (!canRunJob || !jobId || queryPlan?.status !== "finalized") return;
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
      setQueryPlan(await readJobQueryPlan(jobId));
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
      setQueryPlan(await readJobQueryPlan(jobId).catch(() => queryPlan));
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
      toast.success(
        jobId ? "Migration renamed." : `Migration session “${sessionName.trim()}” created.`
      );
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
    setQueryPlan(null);
    void readJobQueryPlan(item.id)
      .then(setQueryPlan)
      .catch((reason: unknown) => setError(message(reason)));
    setPreview(null);
    setCompatibilityCheck(null);
    setError("");
  }

  return (
    <WorkspacePage
      title="Migration Mapper"
      action={
        activeStep === "sessions" ? (
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
        ) : activeStep === "tables" && jobId ? (
          <Button
            type="button"
            disabled={!canRunJob || busy}
            onClick={() => void openMigrationReview()}
          >
            Continue to migration
          </Button>
        ) : null
      }
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
          <Button type="button" variant="ghost" onClick={() => setActiveStep("sessions")}>
            Migrations
          </Button>
          <span className="text-muted-foreground">/</span>
          {activeStep === "fields" ||
          activeStep === "field-editor" ||
          activeStep === "migration" ? (
            <Button type="button" variant="ghost" onClick={() => setActiveStep("tables")}>
              Tables
            </Button>
          ) : null}
          {activeStep === "fields" ||
          activeStep === "field-editor" ||
          activeStep === "migration" ? (
            <span className="text-muted-foreground">/</span>
          ) : null}
          {activeStep === "field-editor" ? (
            <Button type="button" variant="ghost" onClick={() => setActiveStep("fields")}>
              Fields
            </Button>
          ) : null}
          {activeStep === "field-editor" ? <span className="text-muted-foreground">/</span> : null}
          <span className="font-medium">
            {jobs.find((item) => item.id === jobId)?.sessionName ?? sessionName}
          </span>
        </div>
      ) : null}
      <section
        className={`space-y-4 rounded-md border bg-card p-5 ${activeStep === "sessions" ? "" : "hidden"}`}
      >
        <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{jobId ? "Rename migration" : "New migration session"}</DialogTitle>
              <DialogDescription>
                {jobId
                  ? "Update the migration session name."
                  : "Choose saved source and target databases for this migration."}
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
              {!jobId ? (
                <>
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
                        tenant?.database &&
                          targetDatabaseOptions.some((option) => option.value === tenant.database)
                          ? tenant.database
                          : ""
                      );
                      setJobId("");
                      setPreview(null);
                    }}
                    options={tenants.map((item) => ({ label: item.label, value: String(item.id) }))}
                  />
                </>
              ) : null}
            </div>
            {!jobId && targetDatabase && !targetDatabaseMatchesTenant ? (
              <p className="pt-3 text-sm text-destructive">
                Choose a target tenant that uses the selected saved database before saving this
                session.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-4">
              <Button
                type="button"
                disabled={
                  !sessionName.trim() ||
                  (!jobId && (!source || !target || !targetDatabaseMatchesTenant)) ||
                  busy
                }
                onClick={() => void createMigrationJob()}
              >
                {jobId ? "Save changes" : "Create migration"}
              </Button>
            </div>
            <div className="flex justify-end pt-3">
              <Button type="button" variant="outline" onClick={() => setSessionDialogOpen(false)}>
                Cancel
              </Button>
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
      <section
        className={`space-y-4 rounded-md border bg-card p-5 ${activeStep === "tables" ? "" : "hidden"}`}
      >
        <div className="flex flex-nowrap items-end gap-4">
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-medium">
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
                setTableSample(null);
                setSampleRequested(false);
                setMappingPreviewOpen(false);
                setCompatibilityCheck(null);
              }}
              options={tables.map((name) => ({ label: name, value: name }))}
              placeholder={tablesLoading ? "Loading tables…" : "Search and select table"}
              showAllOptionsOnFocus
              value={table}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-medium">
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
                setTableSample(null);
                setSampleRequested(false);
                setMappingPreviewOpen(false);
                setCompatibilityCheck(null);
              }}
              options={targetTables.map((name) => ({ label: name, value: name }))}
              placeholder="Search and select target table"
              showAllOptionsOnFocus
              value={targetTable}
            />
          </label>
          <Button
            type="button"
            className="shrink-0"
            disabled={!table || !targetTable || busy}
            aria-busy={schemaLoading}
            onClick={() => {
              setMappingPreviewOpen(true);
            }}
          >
            {schemaLoading ? "Loading fields…" : "Preview"}
          </Button>
        </div>
        {jobTables.length ? (
          <div className="pt-5">
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
                              setError("");
                              setCompatibilityCheck(null);
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
            Select a migration session, then choose a source and target table on the Table mappings
            page.
          </p>
          <Button
            className="mt-4"
            type="button"
            variant="outline"
            onClick={() => setActiveStep("tables")}
          >
            Open table mappings
          </Button>
        </section>
      ) : null}
      {activeStep === "migration" ? (
        <section className="space-y-4 rounded-md border bg-card p-5">
          <div>
            <h2 className="text-base font-semibold">Migration review</h2>
            <p className="pt-1 text-sm text-muted-foreground">
              {jobs.find((item) => item.id === jobId)?.sessionName ?? sessionName} ·{" "}
              {jobs.find((item) => item.id === jobId)?.sourceDatabase ?? "Source"} →{" "}
              {targetDatabase} · {selectedTargetTenant?.label ?? "Target tenant"}
            </p>
          </div>
          <WorkspaceTablePanel>
            <div className="workspace-scroll overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <WorkspaceTableHeaderCell>Source table</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Target table</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Source rows</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Target rows</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Mapping status</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Migration status</WorkspaceTableHeaderCell>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspaceTablePanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {jobTables.length} of {tables.length} source tables have saved mappings.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!canRunJob || busy}
                onClick={() => void generateQueryPlan()}
              >
                {busy ? "Preparing…" : queryPlan ? "Regenerate query plan" : "Generate query plan"}
              </Button>
              {queryPlan?.status === "generated" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!queryPlan.canFinalize || busy}
                  onClick={() => void finalizeQueryPlan()}
                >
                  Finalize plan
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={!canRunJob || busy || queryPlan?.status !== "finalized"}
                onClick={() => void runJob()}
              >
                {busy ? "Migrating…" : "Run migration"}
              </Button>
            </div>
          </div>
          {queryPlan ? (
            <section
              className="space-y-3 rounded-md border p-4"
              aria-label="Generated migration query plan"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Generated transfer plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {queryPlan.sourceDatabase} → {queryPlan.targetDatabase} ·{" "}
                    {queryPlan.tables.length} tables · {queryPlan.totalSourceRows} source rows
                  </p>
                </div>
                <WorkspaceStatusBadge status={queryPlan.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                This plan copies every row in each mapped table. The read-only sample row selections
                do not limit the migration.
              </p>
              {queryPlan.blockers.length ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Resolve these blockers before finalizing</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {queryPlan.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Preflight passed. Finalizing records this exact mapping and source data
                  fingerprint.
                </p>
              )}
              <WorkspaceTablePanel>
                <div className="workspace-scroll overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <WorkspaceTableHeaderCell>Source → target</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Rows</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Fields</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Excluded source fields</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>SQL template</WorkspaceTableHeaderCell>
                      </tr>
                    </thead>
                    <tbody>
                      {queryPlan.tables.map((item) => (
                        <tr
                          key={`${item.sourceTable}:${item.targetTable}`}
                          className="border-b last:border-0"
                        >
                          <td className="px-3 py-2">
                            {item.sourceTable} → {item.targetTable}
                          </td>
                          <td className="px-3 py-2">
                            {item.sourceRows} → {item.targetRows}
                          </td>
                          <td className="px-3 py-2">{item.columnMappings.length}</td>
                          <td className="max-w-56 px-3 py-2 text-muted-foreground">
                            {item.excludedSourceFields.length
                              ? item.excludedSourceFields.join(", ")
                              : "None"}
                          </td>
                          <td className="max-w-[440px] px-3 py-2">
                            <details>
                              <summary className="cursor-pointer text-primary">
                                View query templates
                              </summary>
                              <div className="space-y-2 pt-2">
                                <pre className="workspace-scroll overflow-x-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">
                                  {item.selectSql}
                                </pre>
                                <pre className="workspace-scroll overflow-x-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">
                                  {item.insertSqlTemplate}
                                </pre>
                              </div>
                            </details>
                            {item.blockers.length ? (
                              <ul className="mt-2 list-disc pl-5 text-amber-700 dark:text-amber-300">
                                {item.blockers.map((blocker) => (
                                  <li key={blocker}>{blocker}</li>
                                ))}
                              </ul>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WorkspaceTablePanel>
              <p className="text-xs text-muted-foreground">
                Generated by {queryPlan.generatedBy} ·{" "}
                {new Date(queryPlan.generatedAt).toLocaleString()} · Plan{" "}
                {queryPlan.hash.slice(0, 12)}
                {queryPlan.finalizedBy ? ` · Finalized by ${queryPlan.finalizedBy}` : ""}
              </p>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate a server-side query plan to review exact tables, fields, row counts, and
              safety checks before finalizing.
            </p>
          )}
        </section>
      ) : null}
      {activeStep === "fields" && schema ? (
        <section className="space-y-4 rounded-md border bg-card p-5">
          <div>
            <h2 className="text-base font-semibold">Field mappings</h2>
            <p className="pt-1 text-sm text-muted-foreground">
              {table} → {targetTable} · Include chooses which source fields transfer; excluded
              fields are not copied. Required target fields must be mapped.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Select a field to edit its destination mapping.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!canPreview || busy || !jobId}
                onClick={() => void saveCurrentTableMapping()}
              >
                Save mapping
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!table || !schema || busy}
                onClick={() => void analyzeTableCompatibility()}
              >
                {busy ? "Analyzing…" : "Analyze compatibility"}
              </Button>
              <Button
                type="button"
                disabled={!selectedSourceColumn || !schema}
                onClick={() => {
                  const mapping = columnMappings.find(
                    (item) => item.sourceColumn === selectedSourceColumn
                  );
                  setSelectedTargetColumn(mapping?.targetColumn ?? "");
                  setError("");
                  setActiveStep("field-editor");
                }}
              >
                Edit mapping
              </Button>
            </div>
          </div>
          <WorkspaceTablePanel>
            <div className="workspace-scroll overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <WorkspaceTableHeaderCell>Select</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Include</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Source field</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Source type</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Destination field</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Mapping status</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {schema.sourceColumns.map((column) => {
                    const mapping = columnMappings.find(
                      (item) => item.sourceColumn === column.name
                    );
                    return (
                      <tr key={column.name} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <Checkbox
                            aria-label={`Select field ${column.name}`}
                            checked={selectedSourceColumn === column.name}
                            onCheckedChange={(checked) => {
                              setSelectedSourceColumn(checked ? column.name : "");
                              setError("");
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Checkbox
                            aria-label={`${mapping ? "Exclude" : "Include"} ${column.name} in transfer`}
                            checked={Boolean(mapping)}
                            onCheckedChange={(checked) => {
                              setError("");
                              setPreview(null);
                              setCompatibilityCheck(null);
                              setQueryPlan(null);
                              if (!checked) {
                                setColumnMappings((current) =>
                                  current.filter((item) => item.sourceColumn !== column.name)
                                );
                                return;
                              }
                              const matchingTarget = schema.targetColumns.find(
                                (targetColumn) =>
                                  targetColumn.name === column.name &&
                                  !columnMappings.some(
                                    (item) => item.targetColumn === targetColumn.name
                                  )
                              );
                              if (matchingTarget) {
                                setColumnMappings((current) => [
                                  ...current,
                                  { sourceColumn: column.name, targetColumn: matchingTarget.name }
                                ]);
                              } else {
                                setSelectedSourceColumn(column.name);
                                setSelectedTargetColumn("");
                                setActiveStep("field-editor");
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{column.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{column.type}</td>
                        <td className="px-3 py-2">
                          {mapping?.targetColumn || (mapping ? "Select destination" : "Excluded")}
                        </td>
                        <td className="px-3 py-2">
                          {mapping?.targetColumn ? "Mapped" : mapping ? "Pending" : "Excluded"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </WorkspaceTablePanel>
          {compatibilityCheck ? (
            <CompatibilityReport
              result={compatibilityCheck}
              sourceColumns={schema.sourceColumns}
              targetColumns={schema.targetColumns}
              columnMappings={columnMappings}
            />
          ) : null}
          <TableDataSampleCard
            sample={tableSample}
            contextKey={sampleContextKey}
            loading={sampleLoading}
            mappingOptions={sampleColumnOptions}
            selectedMappings={selectedSampleFieldMappings}
            allFieldMappings={sampleFieldMappings}
            onShowAllColumns={() => setSampleMappingValues(null)}
            onShow={() => {
              setSampleRequested(true);
            }}
            onRefresh={() =>
              void loadTableSample(tableSample?.source.page ?? 1, tableSample?.target.page ?? 1)
            }
            onPage={(side, page) =>
              void loadTableSample(
                side === "source" ? page : (tableSample?.source.page ?? 1),
                side === "target" ? page : (tableSample?.target.page ?? 1)
              )
            }
          />
        </section>
      ) : null}
      {activeStep === "field-editor" && schema ? (
        <section className="rounded-md border bg-card p-5">
          <div className="pb-4">
            <h2 className="font-semibold">Edit field mappings</h2>
            <p className="pt-1 text-sm text-muted-foreground">
              Child mapping for {table} → {targetTable}. Select a source field and destination
              field, then map them. Required destination fields must be mapped before import.
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
                    upsertFieldMapping(current, selectedSourceColumn, selectedTargetColumn)
                  );
                  setPreview(null);
                  setCompatibilityCheck(null);
                  setQueryPlan(null);
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
      {mappingPreviewOpen && schema && activeStep === "tables" ? (
        <section className="space-y-4 rounded-md border bg-card p-5">
          <div className="grid min-w-0 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <ColumnMappingTable
              title={`Source columns · ${table}`}
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
              {...(preview
                ? {
                    compatibilityFor: (name: string) =>
                      getFieldCompatibility(
                        schema.sourceColumns.find((column) => column.name === name),
                        schema.targetColumns.find(
                          (column) =>
                            column.name ===
                            columnMappings.find((item) => item.sourceColumn === name)?.targetColumn
                        ),
                        getFailingDestinationField(preview?.reason)
                      )
                  }
                : {})}
            />
            <div className="flex flex-col items-center justify-center gap-2 self-center py-2">
              <span className="max-w-48 text-center text-xs text-muted-foreground">
                {selectedSourceColumn && selectedTargetColumn
                  ? `${selectedSourceColumn} → ${selectedTargetColumn}`
                  : "Select a source and target field"}
              </span>
              <Button
                type="button"
                disabled={!selectedSourceColumn || !selectedTargetColumn || busy}
                onClick={() => {
                  setColumnMappings((current) =>
                    upsertFieldMapping(current, selectedSourceColumn, selectedTargetColumn)
                  );
                  setPreview(null);
                  setCompatibilityCheck(null);
                  setQueryPlan(null);
                }}
              >
                Map
              </Button>
            </div>
            <ColumnMappingTable
              title={`Target columns · ${targetTable}`}
              columns={schema.targetColumns}
              selectedColumn={selectedTargetColumn}
              onSelect={setSelectedTargetColumn}
              mappingFor={(name) =>
                columnMappings.find((item) => item.targetColumn === name)?.sourceColumn
              }
              {...(preview
                ? {
                    compatibilityFor: (name: string) =>
                      getFieldCompatibility(
                        schema.sourceColumns.find(
                          (column) =>
                            column.name ===
                            columnMappings.find((item) => item.targetColumn === name)?.sourceColumn
                        ),
                        schema.targetColumns.find((column) => column.name === name),
                        getFailingDestinationField(preview?.reason)
                      )
                  }
                : {})}
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canPreview || busy || !jobId}
              onClick={() => void saveCurrentTableMapping()}
            >
              Save mapping
            </Button>
            <Button type="button" disabled={!canPreview || busy} onClick={() => void inspect()}>
              {busy ? "Checking…" : "Analyze compatibility"}
            </Button>
          </div>
          {preview ? (
            <CompatibilityReport
              result={preview}
              sourceColumns={schema.sourceColumns}
              targetColumns={schema.targetColumns}
              columnMappings={columnMappings}
            />
          ) : null}
          <TableDataSampleCard
            sample={tableSample}
            contextKey={sampleContextKey}
            loading={sampleLoading}
            mappingOptions={sampleColumnOptions}
            selectedMappings={selectedSampleFieldMappings}
            allFieldMappings={sampleFieldMappings}
            onShowAllColumns={() => setSampleMappingValues(null)}
            onShow={() => {
              setSampleRequested(true);
            }}
            onRefresh={() =>
              void loadTableSample(tableSample?.source.page ?? 1, tableSample?.target.page ?? 1)
            }
            onPage={(side, page) =>
              void loadTableSample(
                side === "source" ? page : (tableSample?.source.page ?? 1),
                side === "target" ? page : (tableSample?.target.page ?? 1)
              )
            }
          />
        </section>
      ) : null}
      {activeStep === "sessions" ? (
        <RunHistory runs={runs} sources={sources} tenants={tenants} />
      ) : null}
    </WorkspacePage>
  );
}

function ColumnMappingTable({
  title,
  columns,
  selectedColumn,
  onSelect,
  mappingFor,
  compatibilityFor,
  required = false
}: {
  title: string;
  columns: MigrationTableSchema["sourceColumns"];
  selectedColumn: string;
  onSelect: (name: string) => void;
  mappingFor: (name: string) => string | undefined;
  compatibilityFor?: (name: string) => FieldCompatibility | undefined;
  required?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <WorkspaceTablePanel className="overflow-hidden">
        <div className="workspace-scroll max-h-[28rem] overflow-auto [scrollbar-color:hsl(var(--muted-foreground)/0.35)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 [&::-webkit-scrollbar-track]:bg-transparent">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <WorkspaceTableHeaderCell>Select</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Column</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Type</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>
                  {required ? "Mapped from" : "Mapped to"}
                </WorkspaceTableHeaderCell>
                {compatibilityFor ? (
                  <WorkspaceTableHeaderCell>Match</WorkspaceTableHeaderCell>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {columns.map((column) => {
                const selected = selectedColumn === column.name;
                const mappedColumn = mappingFor(column.name);
                const compatibility = compatibilityFor?.(column.name);
                const mappingClass = compatibility ? compatibilityTextClass(compatibility) : "";
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
                    <td
                      className={`max-w-36 truncate px-3 py-2.5 text-xs ${mappingClass || "text-muted-foreground"}`}
                    >
                      {mappedColumn ?? "Not mapped"}
                    </td>
                    {compatibilityFor ? (
                      <td className="px-3 py-2.5">
                        {compatibility ? <FieldMatchIndicator status={compatibility} /> : null}
                      </td>
                    ) : null}
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

type FieldCompatibility = "match" | "similar" | "different" | "unmapped" | "excluded";

function getFieldCompatibility(
  source: MigrationTableSchema["sourceColumns"][number] | undefined,
  target: MigrationTableSchema["targetColumns"][number] | undefined,
  failingTargetField?: string | null
): FieldCompatibility {
  if (!source) return "unmapped";
  if (!target) return "excluded";
  if (target.name === failingTargetField) return "different";
  const sourceType = normalizeType(source.type);
  const targetType = normalizeType(target.type);
  if (source.name === target.name && sourceType === targetType) return "match";
  return typeFamily(sourceType) === typeFamily(targetType) ? "similar" : "different";
}

function normalizeType(type: string) {
  return type.toLowerCase().replace(/\s+/g, "");
}

function typeFamily(type: string) {
  const baseType = type.split(/[([]/, 1)[0] ?? type;
  if (
    /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|bit)/.test(
      baseType
    )
  )
    return "number";
  if (/^(char|varchar|tinytext|text|mediumtext|longtext|enum|set)/.test(baseType)) return "text";
  if (/^(date|datetime|timestamp|time|year)/.test(baseType)) return "date";
  if (/^(binary|varbinary|tinyblob|blob|mediumblob|longblob)/.test(baseType)) return "binary";
  return baseType;
}

function compatibilityTextClass(status: FieldCompatibility) {
  if (status === "match") return "text-emerald-700 dark:text-emerald-400";
  if (status === "similar") return "text-amber-700 dark:text-amber-400";
  if (status === "excluded") return "text-muted-foreground";
  return "text-red-700 dark:text-red-400";
}

function FieldMatchIndicator({ status }: { status: FieldCompatibility }) {
  const details = {
    match: { label: "Match", Icon: CheckCircle2 },
    similar: { label: "Review", Icon: AlertTriangle },
    different: { label: "Different", Icon: XCircle },
    unmapped: { label: "Unmapped", Icon: XCircle },
    excluded: { label: "Excluded", Icon: AlertTriangle }
  }[status];
  const { Icon, label } = details;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${compatibilityTextClass(status)}`}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span>{label}</span>
    </span>
  );
}

function CompatibilityReport({
  result,
  sourceColumns,
  targetColumns,
  columnMappings
}: {
  result: MigrationPreview;
  sourceColumns: MigrationTableSchema["sourceColumns"];
  targetColumns: MigrationTableSchema["targetColumns"];
  columnMappings: MigrationColumnMapping[];
}) {
  const findings: string[] = [];
  const excludedSource = sourceColumns.filter(
    (column) => !columnMappings.some((mapping) => mapping.sourceColumn === column.name)
  );
  const unmappedRequired = targetColumns.filter(
    (column) =>
      column.required &&
      !column.generated &&
      !columnMappings.some((mapping) => mapping.targetColumn === column.name)
  );
  const failingField = getFailingDestinationField(result.reason);
  if (excludedSource.length) {
    findings.push(
      `Excluded source field${excludedSource.length === 1 ? "" : "s"} (will not be copied): ${excludedSource.map((column) => column.name).join(", ")}.`
    );
  }
  if (unmappedRequired.length) {
    findings.push(
      `Required destination field${unmappedRequired.length === 1 ? "" : "s"} missing: ${unmappedRequired.map((column) => column.name).join(", ")}.`
    );
  }
  if (failingField) {
    const mapping = columnMappings.find((item) => item.targetColumn === failingField);
    findings.push(
      mapping
        ? `Values from source field “${mapping.sourceColumn}” fail validation for destination field “${failingField}”.`
        : `Destination field “${failingField}” failed data validation.`
    );
  }
  for (const mapping of columnMappings) {
    const source = sourceColumns.find((column) => column.name === mapping.sourceColumn);
    const target = targetColumns.find((column) => column.name === mapping.targetColumn);
    if (!source || !target || target.name === failingField) continue;
    if (getFieldCompatibility(source, target) === "different") {
      findings.push(
        `Field type mismatch: ${source.name} (${source.type}) → ${target.name} (${target.type}).`
      );
    }
  }
  if (result.sourceRows > 10000) findings.push("Source row count exceeds the 10,000 row limit.");
  if (result.targetRows > 0) {
    findings.push(
      `Migration is insert-only: destination has ${result.targetRows} rows, so this table is blocked. The destination must be empty. Existing rows are not merged, overwritten, or skipped, even when they match source data.`
    );
  }
  findings.push(
    result.exactMatches === null
      ? "Full-row exact matches were not counted because mapped fields are incomplete, rows changed during analysis, or a table exceeds the analysis row limit."
      : `Full-row exact matches already in the destination: ${result.exactMatches} (all mapped field values match).`
  );
  findings.push(
    result.uniqueKeyConflicts === null
      ? "Unique-key conflicts were not counted because no destination unique key is fully mapped, rows changed during analysis, or a table exceeds the analysis row limit."
      : `Source rows with a matching destination unique key but different mapped values: ${result.uniqueKeyConflicts}.`
  );
  if (!result.compatible && result.reason && !failingField) {
    findings.push(`Analysis detail: ${result.reason}`);
  }
  if (result.compatible && !findings.length) {
    findings.push("No missing required fields. This table passed mapped data validation.");
  }
  const failed =
    !result.compatible ||
    findings.some((finding) => /mismatch|missing|unmapped|fail|exceeds/i.test(finding));
  const warning = !failed && result.targetRows > 0;
  return (
    <div
      role="status"
      className={`rounded-md border px-4 py-3 text-sm ${failed ? "border-destructive/30 bg-destructive/5 text-destructive" : warning ? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"}`}
    >
      <p className="font-medium">
        {failed
          ? "Analysis found issues"
          : warning
            ? "Data compatible · migration blocked"
            : "Analysis passed"}{" "}
        · {result.table}
      </p>
      <p className="pt-1">
        Source: {result.sourceRows} rows · Destination: {result.targetRows} rows
      </p>
      <ul className="list-inside list-disc space-y-1 pt-2">
        {findings.map((finding) => (
          <li key={finding}>{finding}</li>
        ))}
      </ul>
    </div>
  );
}

function TableDataSampleCard({
  sample,
  contextKey,
  loading,
  mappingOptions,
  selectedMappings,
  allFieldMappings,
  onShowAllColumns,
  onShow,
  onRefresh,
  onPage
}: {
  sample: MigrationTableSample | null;
  contextKey: string;
  loading: boolean;
  mappingOptions: WorkspaceColumnOption[];
  selectedMappings: MigrationColumnMapping[] | null;
  allFieldMappings: MigrationColumnMapping[];
  onShowAllColumns: () => void;
  onShow: () => void;
  onRefresh: () => void;
  onPage: (side: "source" | "target", page: number) => void;
}) {
  const [comparisonActive, setComparisonActive] = useState(false);
  const [hideMatches, setHideMatches] = useState(false);
  const [hideUnmatched, setHideUnmatched] = useState(false);
  const [selectedRows, setSelectedRows] = useState<SelectedSampleRow[]>([]);
  useEffect(() => {
    setComparisonActive(false);
    setHideMatches(false);
    setHideUnmatched(false);
    setSelectedRows([]);
  }, [contextKey]);
  const comparisonMappings = selectedMappings ?? allFieldMappings;
  const selectedRowIds = useMemo(
    () => new Set(selectedRows.map((item) => item.id)),
    [selectedRows]
  );
  const sourceMatches = useMemo(() => {
    if (!sample) return new Set<number>();
    return new Set(
      sample.sourceRows.flatMap((sourceRow, index) =>
        sample.targetRows.some((targetRow) => rowMatches(sourceRow, targetRow, comparisonMappings))
          ? [index]
          : []
      )
    );
  }, [comparisonMappings, sample]);
  const targetMatches = useMemo(() => {
    if (!sample) return new Set<number>();
    return new Set(
      sample.targetRows.flatMap((targetRow, index) =>
        sample.sourceRows.some((sourceRow) => rowMatches(sourceRow, targetRow, comparisonMappings))
          ? [index]
          : []
      )
    );
  }, [comparisonMappings, sample]);
  return (
    <section className="space-y-3 rounded-md border bg-card p-4" aria-label="Table data sample">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Table data</h3>
          <p className="pt-1 text-xs text-muted-foreground">
            Read only. Sensitive fields are redacted. Pages contain up to 100 rows.
            {selectedMappings === null
              ? " Choose columns from the Columns menu to narrow both previews."
              : ` Showing ${selectedMappings.length} mapped column${selectedMappings.length === 1 ? "" : "s"}.`}
            {comparisonActive
              ? " Comparison covers visible pages and the selected mapped fields."
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {mappingOptions.length > 0 ? (
            <WorkspaceColumnMenu
              columnOptions={mappingOptions}
              onShowAllColumns={onShowAllColumns}
            />
          ) : null}
          <Button
            type="button"
            variant={comparisonActive ? "default" : "outline"}
            disabled={loading || !sample || comparisonMappings.length === 0}
            aria-pressed={comparisonActive}
            onClick={() => setComparisonActive((active) => !active)}
          >
            {comparisonActive ? "Hide comparison" : "Compare visible data"}
          </Button>
          {comparisonActive ? (
            <>
              <Button
                type="button"
                variant={hideMatches ? "default" : "outline"}
                aria-pressed={hideMatches}
                onClick={() => setHideMatches((hidden) => !hidden)}
              >
                Hide matches
              </Button>
              <Button
                type="button"
                variant={hideUnmatched ? "default" : "outline"}
                aria-pressed={hideUnmatched}
                onClick={() => setHideUnmatched((hidden) => !hidden)}
              >
                Hide unmatched
              </Button>
            </>
          ) : null}
          <Button type="button" variant="outline" disabled={loading} onClick={onShow}>
            Show data
          </Button>
          <Button type="button" variant="outline" disabled={loading || !sample} onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading table data…
        </p>
      ) : null}
      {sample ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <SampleRows
            title={`Source · ${sample.sourceTable}`}
            rows={sample.sourceRows}
            columns={
              selectedMappings === null
                ? sample.sourceColumns
                : [...new Set(selectedMappings.map((item) => item.sourceColumn))]
            }
            matchedRows={comparisonActive ? sourceMatches : null}
            hideMatches={comparisonActive && hideMatches}
            hideUnmatched={comparisonActive && hideUnmatched}
            side="source"
            selectedRowIds={selectedRowIds}
            onToggleRow={(item, checked) =>
              setSelectedRows((current) =>
                checked ? [...current, item] : current.filter((row) => row.id !== item.id)
              )
            }
            totalRows={sample.source.totalRows}
            page={sample.source.page}
            pageSize={sample.pageSize}
            loading={loading}
            onPage={(page) => onPage("source", page)}
          />
          <SampleRows
            title={`Destination · ${sample.targetTable}`}
            rows={sample.targetRows}
            columns={
              selectedMappings === null
                ? sample.targetColumns
                : [...new Set(selectedMappings.map((item) => item.targetColumn))]
            }
            matchedRows={comparisonActive ? targetMatches : null}
            hideMatches={comparisonActive && hideMatches}
            hideUnmatched={comparisonActive && hideUnmatched}
            side="target"
            selectedRowIds={selectedRowIds}
            onToggleRow={(item, checked) =>
              setSelectedRows((current) =>
                checked ? [...current, item] : current.filter((row) => row.id !== item.id)
              )
            }
            totalRows={sample.target.totalRows}
            page={sample.target.page}
            pageSize={sample.pageSize}
            loading={loading}
            onPage={(page) => onPage("target", page)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select Show data to load the selected table pair.
        </p>
      )}
      {selectedRows.length > 0 ? (
        <SelectedRowsBanner
          rows={selectedRows}
          onClear={() => setSelectedRows([])}
          onRemove={(id) => setSelectedRows((current) => current.filter((item) => item.id !== id))}
        />
      ) : null}
    </section>
  );
}

function SampleRows({
  title,
  rows,
  columns,
  totalRows,
  page,
  pageSize,
  loading,
  onPage,
  matchedRows,
  hideMatches,
  hideUnmatched,
  side,
  selectedRowIds,
  onToggleRow
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  columns: string[];
  totalRows: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPage: (page: number) => void;
  matchedRows: Set<number> | null;
  hideMatches: boolean;
  hideUnmatched: boolean;
  side: "source" | "target";
  selectedRowIds: Set<string>;
  onToggleRow: (row: SelectedSampleRow, checked: boolean) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const tableName = title.split(" · ").slice(1).join(" · ");
  const visibleRows = rows.flatMap((row, index) => {
    const matched = matchedRows?.has(index) ?? false;
    if ((matched && hideMatches) || (!matched && hideUnmatched)) return [];
    return [{ row, index, matched }];
  });
  return (
    <div className="min-w-0 space-y-2">
      <h4 className="text-sm font-medium">
        {title} · {totalRows.toLocaleString()} rows
      </h4>
      <WorkspaceTablePanel>
        <div className="workspace-scroll max-h-72 overflow-auto">
          {visibleRows.length ? (
            <table className="w-full min-w-max border-collapse text-xs">
              <thead className="sticky top-0 bg-muted/50">
                <tr>
                  <th className="w-9 px-3 py-2 text-left font-medium text-muted-foreground">
                    <span className="sr-only">Select row</span>
                  </th>
                  {columns.map((column) => (
                    <WorkspaceTableHeaderCell key={column}>{column}</WorkspaceTableHeaderCell>
                  ))}
                  {matchedRows ? (
                    <WorkspaceTableHeaderCell>ROW MATCH</WorkspaceTableHeaderCell>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ row, index, matched }) => {
                  const id = sampleRowKey(side, tableName, page, index);
                  const selectedValues = Object.fromEntries(
                    columns.map((column) => [column, row[column]])
                  );
                  return (
                    <tr key={index} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <Checkbox
                          aria-label={`Select ${side} row ${((page - 1) * pageSize + index + 1).toLocaleString()}`}
                          checked={selectedRowIds.has(id)}
                          onCheckedChange={(checked) =>
                            onToggleRow(
                              {
                                id,
                                side,
                                table: tableName,
                                rowNumber: (page - 1) * pageSize + index + 1,
                                values: selectedValues,
                                columns
                              },
                              Boolean(checked)
                            )
                          }
                        />
                      </td>
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="max-w-64 truncate px-3 py-2"
                          title={sampleValue(row[column])}
                        >
                          {sampleValue(row[column])}
                        </td>
                      ))}
                      {matchedRows ? (
                        <td className="whitespace-nowrap px-3 py-2">
                          <WorkspaceStatusBadge
                            label={matched ? "Match" : "No match"}
                            showIcon={matched}
                            tone={matched ? "success" : "neutral"}
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {rows.length ? "Rows hidden by comparison filters." : "No rows in this table."}
            </p>
          )}
        </div>
      </WorkspaceTablePanel>
      {totalRows > pageSize ? (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Page {page.toLocaleString()} of {pageCount.toLocaleString()} · rows{" "}
            {((page - 1) * pageSize + 1).toLocaleString()}–
            {Math.min(page * pageSize, totalRows).toLocaleString()}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page <= 1}
              onClick={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page >= pageCount}
              onClick={() => onPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type SelectedSampleRow = {
  id: string;
  side: "source" | "target";
  table: string;
  rowNumber: number;
  values: Record<string, unknown>;
  columns: string[];
};

function SelectedRowsBanner({
  rows,
  onClear,
  onRemove
}: {
  rows: SelectedSampleRow[];
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section
      aria-label="Selected preview rows"
      aria-live="polite"
      className="space-y-2 rounded-md border border-primary/20 bg-muted/30 p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Selected rows · {rows.length}</h4>
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear selection
        </Button>
      </div>
      <div className="workspace-scroll max-h-56 overflow-auto rounded-md border bg-card">
        <table className="w-full min-w-max border-collapse text-xs">
          <thead className="sticky top-0 bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell>SIDE</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>TABLE</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>ROW</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>SELECTED DATA</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>ACTION</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-3 py-2 capitalize">{row.side}</td>
                <td className="px-3 py-2">{row.table}</td>
                <td className="px-3 py-2 tabular-nums">{row.rowNumber}</td>
                <td className="max-w-[36rem] px-3 py-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {row.columns.map((column) => (
                      <span key={column}>
                        <span className="font-medium">{column}:</span>{" "}
                        {sampleValue(row.values[column])}
                      </span>
                    ))}
                    {!row.columns.length ? <span>No visible columns</span> : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(row.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function sampleValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function sampleMappingKey(sourceColumn: string, targetColumn: string) {
  return JSON.stringify([sourceColumn, targetColumn]);
}

function upsertFieldMapping(
  mappings: MigrationColumnMapping[],
  sourceColumn: string,
  targetColumn: string
) {
  const withoutTargetConflict = mappings.filter(
    (item) => item.targetColumn !== targetColumn || item.sourceColumn === sourceColumn
  );
  const existing = withoutTargetConflict.find((item) => item.sourceColumn === sourceColumn);
  if (existing) {
    return withoutTargetConflict.map((item) =>
      item.sourceColumn === sourceColumn ? { ...item, targetColumn } : item
    );
  }
  return [...withoutTargetConflict, { sourceColumn, targetColumn }];
}

function sampleRowKey(side: SelectedSampleRow["side"], table: string, page: number, index: number) {
  return JSON.stringify([side, table, page, index]);
}

function rowMatches(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  mappings: MigrationColumnMapping[]
) {
  return (
    mappings.length > 0 &&
    mappings.every((mapping) => {
      const sourceValue = source[mapping.sourceColumn];
      const targetValue = target[mapping.targetColumn];
      if (sourceValue === undefined || targetValue === undefined) return false;
      if (isRedactedSampleValue(sourceValue) || isRedactedSampleValue(targetValue)) return false;
      return normalizeComparisonValue(sourceValue) === normalizeComparisonValue(targetValue);
    })
  );
}

function isRedactedSampleValue(value: unknown) {
  return (
    typeof value === "string" &&
    (value.toLowerCase() === "[redacted]" || value.toLowerCase().startsWith("[binary "))
  );
}

function normalizeComparisonValue(value: unknown) {
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value) ?? String(value);
  return String(value);
}

function getFailingDestinationField(reason: string | null | undefined) {
  return (
    reason?.match(/codexsun_migration_probe_[A-Za-z0-9]+[._]([A-Za-z_][A-Za-z0-9]*)/u)?.[1] ?? null
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
