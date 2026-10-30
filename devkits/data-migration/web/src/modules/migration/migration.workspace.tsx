import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Trash2, XCircle } from "lucide-react";
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
  listSources,
  listTables,
  listTenants,
  getTableSchema,
  previewTransfer,
  readJobQueryPlan,
  handoffJobToAuditQueue,
  finalizeJobQueryPlan,
  readQueryBatch,
  saveJobTablePair,
  saveQueryBatch,
  readJobTables,
  deleteJob,
  deleteJobTablePair,
  deleteQueryBatch,
  listTenantTables,
  sampleTableData,
  type MigrationColumnMapping,
  type MigrationTableSchema,
  type MigrationPreview,
  type MigrationTableSample,
  type MigrationJob,
  type MigrationQueryPlan,
  type MigrationQueryBatch,
  type SavedTableMapping,
  type SourceOption,
  type TenantOption
} from "./migration.services.js";

export function DataMigrationWorkspace({
  initialSelection,
  initialStep = "sessions",
  onAuditHandoff
}: {
  initialSelection?: { sourceId: number; targetTenantId: number; table: string } | undefined;
  initialStep?: "sessions" | "transfer-list";
  onAuditHandoff?: (() => void) | undefined;
}) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [targetTables, setTargetTables] = useState<string[]>([]);
  const [jobTables, setJobTables] = useState<SavedTableMapping[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [queryPlan, setQueryPlan] = useState<MigrationQueryPlan | null>(null);
  const [queryBatch, setQueryBatch] = useState<MigrationQueryBatch | null>(null);
  const [selectedSampleRowIds, setSelectedSampleRowIds] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState<
    "sessions" | "transfer-list" | "tables" | "fields" | "field-editor" | "migration"
  >(initialStep);
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
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialSelection) {
      setSource(String(initialSelection.sourceId));
      setTarget(String(initialSelection.targetTenantId));
    }
    void Promise.all([
      listTenants()
        .then(setTenants)
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
    if (activeStep !== "migration" || !jobId) return;
    let active = true;
    void readQueryBatch(jobId)
      .then((result) => {
        if (active) setQueryBatch(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [activeStep, jobId]);

  useEffect(() => {
    setSelectedSampleRowIds(queryBatch?.rows.map((row) => row.id) ?? []);
  }, [queryBatch?.id]);

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
    if (!jobId) {
      setJobTables([]);
      return;
    }
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
  const handoffRows = queryBatch?.rows.filter((row) => selectedSampleRowIds.includes(row.id)) ?? [];
  const firstHandoffRow = handoffRows[0];
  const handoffMapping = firstHandoffRow
    ? jobTables.find((item) => item.sourceTable === firstHandoffRow.sourceTable)
    : undefined;
  const canHandoff = Boolean(
    jobId &&
    handoffRows.length > 0 &&
    handoffRows.every(
      (row) =>
        row.sourceTable === firstHandoffRow?.sourceTable &&
        row.targetTable === firstHandoffRow?.targetTable
    ) &&
    handoffMapping?.targetTable === firstHandoffRow?.targetTable &&
    handoffMapping?.mappingStatus === "mapped"
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

  async function handoffSelectedRows() {
    if (!jobId || !canHandoff) return;
    setBusy(true);
    setError("");
    try {
      await handoffJobToAuditQueue(
        jobId,
        handoffRows.map((row) => row.id)
      );
      toast.success(
        `${handoffRows.length} saved row sample${handoffRows.length === 1 ? "" : "s"} handed off to Migration Audit.`
      );
      onAuditHandoff?.();
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

  async function removeMigration(item: MigrationJob) {
    if (item.status !== "draft") return;
    if (
      !window.confirm(
        `Delete draft migration “${item.sessionName}” and its saved mappings, samples, plans, and audit items? Source and target database rows are not affected.`
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      await deleteJob(item.id);
      setJobs((current) => current.filter((job) => job.id !== item.id));
      if (jobId === item.id) {
        setJobId("");
        setJobTables([]);
        setQueryBatch(null);
        setQueryPlan(null);
        setSelectedSampleRowIds([]);
        setActiveStep("sessions");
      }
      toast.success("Draft migration and its saved data deleted.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setDeleting(false);
    }
  }

  async function removeSavedTable(item: SavedTableMapping) {
    if (!jobId || jobs.find((job) => job.id === jobId)?.status !== "draft") return;
    const sourceTable = item.sourceTable ?? item.table;
    const targetName = item.targetTable ?? item.table;
    if (
      !window.confirm(
        `Delete the saved mapping ${sourceTable} → ${targetName}, its selected samples, and related audit items? Database rows are not affected.`
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      await deleteJobTablePair(jobId, sourceTable);
      const [savedTables, savedJobs, batch] = await Promise.all([
        readJobTables(jobId),
        listJobs(),
        readQueryBatch(jobId)
      ]);
      setJobTables(savedTables);
      setJobs(savedJobs);
      setQueryBatch(batch);
      setQueryPlan(await readJobQueryPlan(jobId));
      setSelectedSampleRowIds(batch?.rows.map((row) => row.id) ?? []);
      toast.success(`Saved mapping ${sourceTable} → ${targetName} deleted.`);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setDeleting(false);
    }
  }

  async function removeSavedSamples() {
    if (!jobId || !queryBatch) return;
    if (
      !window.confirm(
        `Delete all ${queryBatch.rows.length} saved row samples and audit queue items for this migration? Source and target database rows are not affected.`
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      const result = await deleteQueryBatch(jobId);
      setQueryBatch(null);
      setSelectedSampleRowIds([]);
      toast.success(
        `${result.deletedRows} saved row sample${result.deletedRows === 1 ? "" : "s"} deleted.`
      );
    } catch (reason) {
      setError(message(reason));
    } finally {
      setDeleting(false);
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
    setQueryBatch(null);
    setSelectedSampleRowIds([]);
    setJobTables([]);
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
      title={
        activeStep === "tables"
          ? "Table Mapping"
          : activeStep === "migration" || activeStep === "transfer-list"
            ? "Transfer Review"
            : "Migration Mapper"
      }
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
            Continue to transfer review
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
      {activeStep !== "sessions" && activeStep !== "transfer-list" ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button type="button" variant="ghost" onClick={() => setActiveStep("sessions")}>
            Migrations
          </Button>
          {activeStep === "tables" ? (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Table Mapping</span>
            </>
          ) : null}
          {activeStep === "migration" ? (
            <>
              <span className="text-muted-foreground">/</span>
              <Button type="button" variant="ghost" onClick={() => setActiveStep("tables")}>
                Table Mapping
              </Button>
            </>
          ) : null}
          {activeStep === "fields" || activeStep === "field-editor" ? (
            <>
              <span className="text-muted-foreground">/</span>
              <Button type="button" variant="ghost" onClick={() => setActiveStep("tables")}>
                Table Mapping
              </Button>
            </>
          ) : null}
          {activeStep === "fields" || activeStep === "field-editor" ? (
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
          {activeStep === "migration" ? (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Transfer Review</span>
            </>
          ) : null}
        </div>
      ) : null}
      <section
        className={`space-y-4 p-5 ${activeStep === "sessions" || activeStep === "transfer-list" ? "" : "hidden"}`}
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
            <h3 className="pb-2 text-sm font-semibold">
              {activeStep === "transfer-list" ? "Migrations ready for review" : "Saved migrations"}
            </h3>
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
                          setActiveStep(activeStep === "transfer-list" ? "migration" : "tables");
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
                              Table Mapping
                            </Button>
                            {activeStep === "transfer-list" ? (
                              <Button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  selectJob(item.id);
                                  setActiveStep("migration");
                                }}
                              >
                                Review transfer
                              </Button>
                            ) : null}
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
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              title="Delete draft migration and its saved data"
                              aria-label={`Delete draft migration ${item.sessionName}`}
                              disabled={deleting || item.status !== "draft"}
                              onClick={(event) => {
                                event.stopPropagation();
                                void removeMigration(item);
                              }}
                            >
                              <Trash2 className="text-destructive" />
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
        ) : activeStep === "transfer-list" ? (
          <p className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
            No saved migrations are available for review.
          </p>
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
          <div className="space-y-2 pt-2">
            <h2 className="text-sm font-semibold">Saved table mappings</h2>
            <WorkspaceTablePanel>
              <div className="workspace-scroll overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <WorkspaceTableHeaderCell>Source table</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Target table</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Source rows</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Target rows</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Fields mapped</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                      <WorkspaceTableHeaderCell>Action</WorkspaceTableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {jobTables.map((item) => (
                      <tr
                        key={
                          item.id ??
                          `${item.sourceTable ?? item.table}:${item.targetTable ?? item.table}`
                        }
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-2">{item.sourceTable ?? item.table}</td>
                        <td className="px-3 py-2">{item.targetTable ?? item.table}</td>
                        <td className="px-3 py-2">{item.sourceRows ?? "—"}</td>
                        <td className="px-3 py-2">{item.targetRows ?? "—"}</td>
                        <td className="px-3 py-2">{item.columnMappings.length}</td>
                        <td className="px-3 py-2">{item.mappingStatus ?? "mapped"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setTable(item.sourceTable ?? item.table);
                                setTargetTable(item.targetTable ?? item.table);
                                setMappingPreviewOpen(false);
                                setCompatibilityCheck(null);
                                setError("");
                                setActiveStep("fields");
                              }}
                            >
                              Review / edit
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              title="Delete saved table mapping and related samples"
                              aria-label={`Delete mapping ${item.sourceTable ?? item.table}`}
                              disabled={
                                deleting || jobs.find((job) => job.id === jobId)?.status !== "draft"
                              }
                              onClick={() => void removeSavedTable(item)}
                            >
                              <Trash2 className="text-destructive" />
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
        <section className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {jobs.find((item) => item.id === jobId)?.sessionName ?? sessionName} ·{" "}
            {jobs.find((item) => item.id === jobId)?.sourceDatabase ?? "Source"} → {targetDatabase}{" "}
            · {selectedTargetTenant?.label ?? "Target tenant"}
          </div>
          <section className="space-y-2" aria-label="Transfer overview">
            <h3 className="text-sm font-semibold">Transfer overview</h3>
            {jobTables.length ? (
              <div className="space-y-3">
                {jobTables.map((item) => (
                  <WorkspaceTablePanel key={item.id ?? item.sourceTable ?? item.table}>
                    <div className="flex items-center justify-between gap-3 px-4 pt-3">
                      <h4 className="font-semibold">
                        {item.sourceTable ?? item.table} → {item.targetTable ?? item.table}
                      </h4>
                      <div className="flex items-center gap-2">
                        {queryBatch ? <WorkspaceStatusBadge status={queryBatch.status} /> : null}
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="Delete saved table mapping and related samples"
                          aria-label={`Delete mapping ${item.sourceTable ?? item.table}`}
                          disabled={
                            deleting || jobs.find((job) => job.id === jobId)?.status !== "draft"
                          }
                          onClick={() => void removeSavedTable(item)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="workspace-scroll overflow-x-auto p-3 pt-2">
                      <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
                        <colgroup>
                          <col className="w-[13%]" />
                          <col className="w-[37%]" />
                          <col className="w-[13%]" />
                          <col className="w-[37%]" />
                        </colgroup>
                        <tbody>
                          <TransferOverviewRow
                            leftLabel="Source database"
                            leftValue={
                              queryBatch?.sourceDatabase ??
                              jobs.find((job) => job.id === jobId)?.sourceDatabase ??
                              "—"
                            }
                            rightLabel="Source"
                            rightValue={queryBatch?.sourceLabel ?? "—"}
                          />
                          <TransferOverviewRow
                            leftLabel="Source table"
                            leftValue={item.sourceTable ?? item.table}
                            rightLabel="Host"
                            rightValue={queryBatch?.sourceHost ?? "—"}
                          />
                          <TransferOverviewRow
                            leftLabel="Source rows"
                            leftValue={item.sourceRows ?? 0}
                            rightLabel="Source user"
                            rightValue={
                              queryBatch
                                ? `${queryBatch.sourceUser} · ${queryBatch.passwordStored ? "••••••••" : "No saved password"}`
                                : "—"
                            }
                          />
                          <TransferOverviewRow
                            leftLabel="Target database"
                            leftValue={targetDatabase}
                            rightLabel="Mapping status"
                            rightValue={item.mappingStatus ?? "mapped"}
                          />
                          <TransferOverviewRow
                            leftLabel="Target table"
                            leftValue={item.targetTable ?? item.table}
                            rightLabel="Migration status"
                            rightValue={item.migrationStatus ?? "pending"}
                          />
                          <TransferOverviewRow
                            leftLabel="Target rows"
                            leftValue={item.targetRows ?? 0}
                            rightLabel="Saved rows"
                            rightValue={queryBatch?.status ?? "—"}
                          />
                        </tbody>
                      </table>
                    </div>
                  </WorkspaceTablePanel>
                ))}
              </div>
            ) : (
              <WorkspaceTablePanel>
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No table mappings have been saved for this migration.
                </p>
              </WorkspaceTablePanel>
            )}
          </section>
          {queryBatch ? (
            <section className="space-y-2" aria-label="Saved row samples">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  Saved row samples · {selectedSampleRowIds.length} selected of{" "}
                  {queryBatch.rows.length}
                </h3>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  title="Delete saved samples and related audit items"
                  aria-label="Delete all saved row samples"
                  disabled={deleting || jobs.find((job) => job.id === jobId)?.status !== "draft"}
                  onClick={() => void removeSavedSamples()}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
              <WorkspaceTablePanel>
                <div className="workspace-scroll overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse text-sm">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <WorkspaceTableHeaderCell>
                          <Checkbox
                            aria-label="Select all saved row samples"
                            checked={
                              queryBatch.rows.length > 0 &&
                              selectedSampleRowIds.length === queryBatch.rows.length
                            }
                            onCheckedChange={(checked) =>
                              setSelectedSampleRowIds(
                                checked ? queryBatch.rows.map((row) => row.id) : []
                              )
                            }
                          />
                        </WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Table pair</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Row</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Full JSON</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                      </tr>
                    </thead>
                    <tbody>
                      {queryBatch.rows.map((row) => (
                        <tr key={row.id} className="border-b last:border-0">
                          <td className="w-12 px-3 py-2">
                            <Checkbox
                              aria-label={`Select ${row.sourceTable} row ${row.rowNumber}`}
                              checked={selectedSampleRowIds.includes(row.id)}
                              onCheckedChange={(checked) =>
                                setSelectedSampleRowIds((current) =>
                                  checked
                                    ? [...new Set([...current, row.id])]
                                    : current.filter((id) => id !== row.id)
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            {row.sourceTable} → {row.targetTable}
                          </td>
                          <td className="px-3 py-2">{row.rowNumber}</td>
                          <td className="max-w-[48rem] px-3 py-2">
                            <pre className="whitespace-pre-wrap break-all rounded-sm bg-muted/30 p-2 text-xs">
                              {JSON.stringify(row.rowData, null, 2)}
                            </pre>
                          </td>
                          <td className="px-3 py-2">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WorkspaceTablePanel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Hand off the selected saved row samples and their mapped SQL template to audit.
                </p>
              </div>
            </section>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="default"
                disabled={!canHandoff || busy}
                onClick={() => void handoffSelectedRows()}
                aria-label="Hand off selected rows to migration audit"
              >
                {busy ? "Handing off…" : "Hand off"}
              </Button>
              {!canHandoff && !busy ? (
                <span className="text-xs text-muted-foreground" role="status">
                  {!queryBatch
                    ? "Loading saved row samples…"
                    : !queryBatch.rows.length
                      ? "Save selected row samples first."
                      : !handoffRows.length
                        ? "Select at least one saved row sample."
                        : "Save the source-to-target table mapping first."}
                </span>
              ) : null}
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
            </div>
          </div>
          {queryPlan ? (
            <section className="space-y-3" aria-label="Generated migration query plan">
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
              <p className="text-xs text-muted-foreground">
                Sample rows are previews only; migration transfers all mapped rows.
              </p>
              {queryPlan.blockers.length ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {queryPlan.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Preflight passed.</p>
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
          ) : null}
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
            jobId={jobId}
            tablePairSaved={jobTables.some(
              (item) =>
                item.sourceTable === table &&
                item.targetTable === targetTable &&
                item.mappingStatus === "mapped"
            )}
            sourceInfo={sources.find((item) => item.id === Number(source))}
            onSaved={() => setActiveStep("migration")}
            sample={tableSample}
            contextKey={sampleContextKey}
            loading={sampleLoading}
            mappingOptions={sampleColumnOptions}
            selectedMappings={selectedSampleFieldMappings}
            allFieldMappings={sampleFieldMappings}
            targetColumns={schema.targetColumns}
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
            jobId={jobId}
            tablePairSaved={jobTables.some(
              (item) =>
                item.sourceTable === table &&
                item.targetTable === targetTable &&
                item.mappingStatus === "mapped"
            )}
            sourceInfo={sources.find((item) => item.id === Number(source))}
            onSaved={() => setActiveStep("migration")}
            sample={tableSample}
            contextKey={sampleContextKey}
            loading={sampleLoading}
            mappingOptions={sampleColumnOptions}
            selectedMappings={selectedSampleFieldMappings}
            allFieldMappings={sampleFieldMappings}
            targetColumns={schema.targetColumns}
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
  jobId,
  tablePairSaved,
  sourceInfo,
  onSaved,
  sample,
  contextKey,
  loading,
  mappingOptions,
  selectedMappings,
  allFieldMappings,
  targetColumns,
  onShowAllColumns,
  onShow,
  onRefresh,
  onPage
}: {
  jobId: string;
  tablePairSaved: boolean;
  sourceInfo: SourceOption | undefined;
  onSaved: () => void;
  sample: MigrationTableSample | null;
  contextKey: string;
  loading: boolean;
  mappingOptions: WorkspaceColumnOption[];
  selectedMappings: MigrationColumnMapping[] | null;
  allFieldMappings: MigrationColumnMapping[];
  targetColumns: MigrationTableSchema["targetColumns"];
  onShowAllColumns: () => void;
  onShow: () => void;
  onRefresh: () => void;
  onPage: (side: "source" | "target", page: number) => void;
}) {
  const [comparisonActive, setComparisonActive] = useState(false);
  const [hideMatches, setHideMatches] = useState(false);
  const [hideUnmatched, setHideUnmatched] = useState(false);
  const [selectedRows, setSelectedRows] = useState<SelectedSampleRow[]>([]);
  const [selectedRowsQuery, setSelectedRowsQuery] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<
    Record<string, { mode: "default" | "custom" | "foreign"; value: unknown }>
  >({});
  const [savingSelection, setSavingSelection] = useState(false);
  useEffect(() => {
    setComparisonActive(false);
    setHideMatches(false);
    setHideUnmatched(false);
    setSelectedRows([]);
    setSelectedRowsQuery(null);
    setFieldValues({});
  }, [contextKey]);
  const comparisonMappings = selectedMappings ?? allFieldMappings;
  const missingFields = targetColumns.filter(
    (column) =>
      !column.generated && !allFieldMappings.some((mapping) => mapping.targetColumn === column.name)
  );
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
            onToggleRow={(item, checked) => {
              setSelectedRowsQuery(null);
              setSelectedRows((current) =>
                checked ? [...current, item] : current.filter((row) => row.id !== item.id)
              );
            }}
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
            onToggleRow={(item, checked) => {
              setSelectedRowsQuery(null);
              setSelectedRows((current) =>
                checked ? [...current, item] : current.filter((row) => row.id !== item.id)
              );
            }}
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
          jobId={jobId}
          tablePairSaved={tablePairSaved}
          sourceInfo={sourceInfo}
          missingFields={missingFields}
          fieldValues={fieldValues}
          onFieldValueChange={(name, value) => {
            setFieldValues((current) => ({ ...current, [name]: value }));
            setSelectedRowsQuery(null);
          }}
          saving={savingSelection}
          onSave={async () => {
            if (!jobId || !sample) return;
            setSavingSelection(true);
            try {
              const sourceRows = selectedRows.filter((row) => row.side === "source");
              const result = await saveQueryBatch(jobId, {
                rows: sourceRows.map((row) => ({
                  sourceTable: sample.sourceTable,
                  targetTable: sample.targetTable,
                  rowNumber: row.rowNumber,
                  rowData: row.values
                })),
                fieldValues: Object.fromEntries(
                  missingFields.map((field) => [
                    field.name,
                    fieldValues[field.name] ?? {
                      mode: field.reference ? "foreign" : field.required ? "custom" : "default",
                      value: ""
                    }
                  ])
                )
              });
              toast.success(`Saved ${result.savedRows} selected source rows for Transfer Review.`);
              onSaved();
            } catch (reason) {
              toast.error(
                reason instanceof Error ? reason.message : "Could not save selected rows."
              );
            } finally {
              setSavingSelection(false);
            }
          }}
          onClear={() => {
            setSelectedRowsQuery(null);
            setSelectedRows([]);
          }}
          onRemove={(id) => {
            setSelectedRowsQuery(null);
            setSelectedRows((current) => current.filter((item) => item.id !== id));
          }}
          onGenerateQuery={() => {
            const sourceRowCount = selectedRows.filter((row) => row.side === "source").length;
            const mappings = allFieldMappings.filter(
              (mapping) => mapping.sourceColumn.trim() && mapping.targetColumn.trim()
            );
            if (!sourceRowCount || !sample || !mappings.length) {
              setSelectedRowsQuery(null);
              return;
            }
            const quote = (identifier: string) => `\`${identifier.replaceAll("`", "``")}\``;
            const defaultsToWrite = missingFields.filter((field) => {
              const mode =
                fieldValues[field.name]?.mode ??
                (field.reference ? "foreign" : field.required ? "custom" : "default");
              return mode !== "default";
            });
            const columnCount = mappings.length + defaultsToWrite.length;
            const targetColumns = [
              ...mappings.map((mapping) => quote(mapping.targetColumn)),
              ...defaultsToWrite.map((field) => quote(field.name))
            ].join(", ");
            const values = `(${Array.from({ length: columnCount }, () => "?").join(", ")})`;
            setSelectedRowsQuery(
              `INSERT INTO ${quote(sample.targetTable)} (${targetColumns})\n` +
                `VALUES ${Array.from({ length: sourceRowCount }, () => values).join(",\n       ")};`
            );
          }}
          canGenerateQuery={
            Boolean(jobId) &&
            selectedRows.some((row) => row.side === "source") &&
            allFieldMappings.some(
              (mapping) => mapping.sourceColumn.trim() && mapping.targetColumn.trim()
            )
          }
          query={selectedRowsQuery}
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
  jobId,
  tablePairSaved,
  sourceInfo,
  missingFields,
  fieldValues,
  onFieldValueChange,
  saving,
  onSave,
  onClear,
  onRemove,
  onGenerateQuery,
  canGenerateQuery,
  query
}: {
  rows: SelectedSampleRow[];
  jobId: string;
  tablePairSaved: boolean;
  sourceInfo: SourceOption | undefined;
  missingFields: MigrationTableSchema["targetColumns"];
  fieldValues: Record<string, { mode: "default" | "custom" | "foreign"; value: unknown }>;
  onFieldValueChange: (
    name: string,
    value: { mode: "default" | "custom" | "foreign"; value: unknown }
  ) => void;
  saving: boolean;
  onSave: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onGenerateQuery: () => void;
  canGenerateQuery: boolean;
  query: string | null;
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
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={!canGenerateQuery} onClick={onGenerateQuery}>
          Generate query
        </Button>
      </div>
      {!tablePairSaved ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          Save this source → target table mapping before saving selected rows.
        </p>
      ) : null}
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <div className="workspace-scroll max-h-72 overflow-auto rounded-md border bg-card p-2">
          <h5 className="px-2 pb-1 text-xs font-semibold">Data preview</h5>
          {rows
            .filter((row) => row.side === "source")
            .map((row) => (
              <div key={row.id} className="border-b p-2 last:border-0">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium">
                    {row.table} · row {row.rowNumber}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(row.id)}
                  >
                    Remove
                  </Button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
                  {JSON.stringify(row.values, null, 2)}
                </pre>
              </div>
            ))}
        </div>
        <div className="workspace-scroll max-h-72 overflow-auto rounded-md border bg-muted p-3">
          <h5 className="pb-1 text-xs font-semibold">Query preview</h5>
          {query ? (
            <pre className="whitespace-pre-wrap break-words text-xs">
              <code>{query}</code>
            </pre>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {missingFields.map((field) => {
          const valueMode =
            fieldValues[field.name]?.mode ??
            (field.reference ? "foreign" : field.required ? "custom" : "default");
          const options = field.foreignOptions ?? [];
          const sqlType = field.type.toLowerCase();
          const enumBody = /^enum\((.*)\)$/iu.exec(sqlType)?.[1];
          const enumOptions = enumBody
            ? [...enumBody.matchAll(/'((?:\\.|[^'])*)'/gu)].map((match) => match[1] ?? "")
            : [];
          const inputType = /\b(date|datetime|timestamp)\b/iu.test(sqlType)
            ? sqlType.includes("time")
              ? "datetime-local"
              : "date"
            : /\b(int|decimal|numeric|float|double|real)\b/iu.test(sqlType)
              ? "number"
              : "text";
          return (
            <label key={field.name} className="grid gap-1 text-xs">
              <span>
                {field.name} · {field.type}
              </span>
              <select
                className="h-9 rounded-md border bg-background px-2"
                value={valueMode}
                onChange={(event) =>
                  onFieldValueChange(field.name, {
                    mode: event.target.value as "default" | "custom" | "foreign",
                    value: fieldValues[field.name]?.value ?? ""
                  })
                }
              >
                {!field.required || field.defaultValue !== null ? (
                  <option value="default">Database default</option>
                ) : null}
                {field.reference ? (
                  <option value="foreign">
                    Select {field.reference.table}.{field.reference.column}
                  </option>
                ) : null}
                <option value="custom">Custom value</option>
              </select>
              {valueMode === "foreign" ? (
                <select
                  className="h-9 rounded-md border bg-background px-2"
                  value={String(fieldValues[field.name]?.value ?? "")}
                  onChange={(event) =>
                    onFieldValueChange(field.name, { mode: "foreign", value: event.target.value })
                  }
                >
                  <option value="">
                    {options.length ? "Select value" : "No referenced values available"}
                  </option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : valueMode !== "default" && /tinyint\(1\)/iu.test(sqlType) ? (
                <select
                  className="h-9 rounded-md border bg-background px-2"
                  value={String(fieldValues[field.name]?.value ?? "")}
                  onChange={(event) =>
                    onFieldValueChange(field.name, { mode: "custom", value: event.target.value })
                  }
                >
                  <option value="">Select value</option>
                  <option value="0">0 · false</option>
                  <option value="1">1 · true</option>
                </select>
              ) : valueMode !== "default" && enumOptions.length ? (
                <select
                  className="h-9 rounded-md border bg-background px-2"
                  value={String(fieldValues[field.name]?.value ?? "")}
                  onChange={(event) =>
                    onFieldValueChange(field.name, { mode: "custom", value: event.target.value })
                  }
                >
                  <option value="">Select value</option>
                  {enumOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : valueMode !== "default" ? (
                <Input
                  type={inputType}
                  value={String(fieldValues[field.name]?.value ?? "")}
                  placeholder="Enter value"
                  onChange={(event) =>
                    onFieldValueChange(field.name, { mode: valueMode, value: event.target.value })
                  }
                />
              ) : null}
            </label>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span>
          {sourceInfo
            ? `${sourceInfo.label} · ${sourceInfo.host}:${sourceInfo.port} · ${sourceInfo.database} · ${sourceInfo.user} · ••••••••`
            : "Source connection unavailable"}
        </span>
        <Button
          type="button"
          disabled={
            !jobId ||
            !tablePairSaved ||
            !query ||
            !rows.some((row) => row.side === "source") ||
            saving ||
            missingFields.some((field) => {
              const value = fieldValues[field.name];
              const mode =
                value?.mode ??
                (field.reference ? "foreign" : field.required ? "custom" : "default");
              return mode === "default"
                ? field.required && field.defaultValue === null
                : value?.value === undefined || value.value === null || value.value === "";
            })
          }
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save for Transfer Review"}
        </Button>
      </div>
    </section>
  );
}

function TransferOverviewRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue
}: {
  leftLabel: string;
  leftValue: string | number;
  rightLabel: string;
  rightValue: string | number;
}) {
  return (
    <tr className="border-b last:border-0">
      <th className="border-r bg-muted/30 px-3 py-2 text-left font-medium text-muted-foreground">
        {leftLabel}
      </th>
      <td className="border-r px-3 py-2">{leftValue}</td>
      <th className="border-r bg-muted/30 px-3 py-2 text-left font-medium text-muted-foreground">
        {rightLabel}
      </th>
      <td className="px-3 py-2">{rightValue}</td>
    </tr>
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
