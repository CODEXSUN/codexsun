"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { useMasterDetails, useMasterLookups } from "../master/master.hooks";
import { useProgramDetails, useProgramLookups } from "../program/program.hooks";
import { SessionForm } from "./session.form";
import { sessionQueryKeys, useSessionDetails, useSessionsPage } from "./session.hooks";
import { SessionList } from "./session.list";
import { createSession, updateSession } from "./session.services";
import type { SessionColumnFilters, SessionRecord, SessionSavePayload } from "./session.types";

type RouteMode = "list" | "new" | "view" | "edit";
type Navigate = (options: { mode?: RouteMode | undefined; uuid?: string | undefined }) => void;

export function SessionWorkspace({
  mode = "list", uuid, onNavigate
}: {
  mode?: RouteMode | undefined;
  uuid?: string | undefined;
  onNavigate?: Navigate | undefined;
}) {
  const queryClient = useQueryClient();
  const [programSearch, setProgramSearch] = useState("");
  const [masterSearch, setMasterSearch] = useState("");
  const { data: programs = [] } = useProgramLookups(useDeferredValue(programSearch));
  const { data: masters = [] } = useMasterLookups(useDeferredValue(masterSearch));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [columnFilters, setColumnFilters] = useState<SessionColumnFilters>({});
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [localMode, setLocalMode] = useState<RouteMode>("list");
  const [localRecord, setLocalRecord] = useState<SessionRecord | null>(null);
  const currentMode = onNavigate ? mode : localMode;
  const recordUuid = onNavigate ? uuid : localRecord?.uuid;
  const deferredSearch = useDeferredValue(search);
  const deferredColumnFilters = useDeferredValue(columnFilters);
  const { data, isLoading } = useSessionsPage({
    page, pageSize, search: deferredSearch.trim(), status: statusFilter,
    columnFilters: deferredColumnFilters
  });
  const detail = useSessionDetails(currentMode === "edit" || currentMode === "view" ? recordUuid : undefined);
  const selected = detail.data ?? localRecord;
  const { data: selectedProgram } = useProgramDetails(selected?.programUuid);
  const { data: selectedMaster } = useMasterDetails(selected?.masterUuid);
  const programOptions = programs.map((program) => ({ label: program.name, value: program.uuid }));
  const masterOptions = masters.map((master) => ({ label: master.name, value: master.uuid }));
  if (selectedProgram && !programOptions.some((option) => option.value === selectedProgram.uuid)) programOptions.unshift({ label: selectedProgram.name, value: selectedProgram.uuid });
  if (selectedMaster && !masterOptions.some((option) => option.value === selectedMaster.uuid)) masterOptions.unshift({ label: selectedMaster.name, value: selectedMaster.uuid });

  function navigate(next: RouteMode, record?: SessionRecord) {
    if (onNavigate) onNavigate({ mode: next, ...(record ? { uuid: record.uuid } : {}) });
    else { setLocalRecord(record ?? null); setLocalMode(next); }
  }

  const createMutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      toast.success("Training session scheduled");
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const updateMutation = useMutation({
    mutationFn: ({ record, payload }: { record: SessionRecord; payload: SessionSavePayload }) =>
      updateSession(record.uuid, payload, record.revision),
    onSuccess: () => {
      toast.success("Training session updated");
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const suspendMutation = useMutation({
    mutationFn: (record: SessionRecord) => updateSession(record.uuid, sessionPayload(record, "cancelled"), record.revision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all }),
    onError: (error: Error) => toast.error(error.message)
  });
  const restoreMutation = useMutation({
    mutationFn: (record: SessionRecord) => updateSession(record.uuid, sessionPayload(record, "active"), record.revision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all }),
    onError: (error: Error) => toast.error(error.message)
  });

  if ((currentMode === "edit" || currentMode === "view") && !selected) {
    return <WorkspacePage title="" variant="list"><p role={detail.error ? "alert" : "status"} className="p-4 text-sm text-muted-foreground">{detail.error?.message ?? "Loading session…"}</p></WorkspacePage>;
  }
  if (currentMode === "new" || currentMode === "edit") {
    return <WorkspacePage title="" variant="list"><SessionForm
      key={selected?.uuid ?? "new"}
      initialRecord={currentMode === "edit" ? selected : null}
      programOptions={programOptions}
      masterOptions={masterOptions}
      programSearch={programSearch} onProgramSearchChange={setProgramSearch}
      masterSearch={masterSearch} onMasterSearchChange={setMasterSearch}
      isSaving={createMutation.isPending || updateMutation.isPending}
      onSubmit={(payload) => selected && currentMode === "edit" ? updateMutation.mutate({ record: selected, payload }) : createMutation.mutate(payload)}
      onCancel={() => navigate("list")}
    /></WorkspacePage>;
  }
  if (currentMode === "view" && selected) {
    return <WorkspacePage title="" variant="list"><div className="space-y-3 p-4 text-sm">
      <p className="font-semibold">{selected.title}</p>
      <p>Schedule: {selected.daysOfWeek}, {selected.startTime}–{selected.endTime}</p>
      <p>Venue: {selected.venue}</p>
      <p>Capacity: {selected.maxCapacity}</p>
      <Button type="button" variant="outline" onClick={() => navigate("list")}>Back to sessions</Button>
    </div></WorkspacePage>;
  }

  const records = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const columns = ["title", "masterName", "schedule", "venue", "capacity", "status"];
  return <WorkspacePage title="" variant="list">
    <WorkspaceFilters
      toolbarAction={<Button type="button" variant={showInlineFilters ? "default" : "outline"} aria-label="Toggle column search filters" aria-pressed={showInlineFilters} onClick={() => setShowInlineFilters(!showInlineFilters)}><SlidersHorizontal className="size-4" /></Button>}
      columnOptions={columns.map((id) => ({ id, label: id === "title" ? "Batch / Session" : id, checked: visibleColumns[id] !== false, onCheckedChange: (checked: boolean) => setVisibleColumns((state) => ({ ...state, [id]: checked })) }))}
      onShowAllColumns={() => setVisibleColumns({})}
      searchValue={search} onSearchValueChange={(value) => { setSearch(value); setPage(1); }}
      searchPlaceholder="Search session title or venue…"
      filterValue={statusFilter} onFilterValueChange={(value) => { setStatusFilter(value); setPage(1); }}
      filterOptions={[{ id: "all", label: "All Sessions" }, { id: "active", label: "Active" }, { id: "cancelled", label: "Cancelled" }]}
    />
    <SessionList records={records} isLoading={isLoading} visibleColumns={visibleColumns}
      showInlineFilters={showInlineFilters} columnFilters={columnFilters}
      onColumnFilterChange={(column, value) => { setColumnFilters((state) => ({ ...state, [column]: value })); setPage(1); }}
      onView={(record) => navigate("view", record)} onEdit={(record) => navigate("edit", record)}
      onSuspend={(record) => suspendMutation.mutate(record)} onRestore={(record) => restoreMutation.mutate(record)}
    />
    {total > 100 ? <WorkspacePagination page={page} totalPages={totalPages} totalCount={total} rowsPerPage={pageSize} onPageChange={setPage} onRowsPerPageChange={() => undefined} singularLabel="session" showingLabel={buildShowingLabel(page, pageSize, total)} /> : null}
  </WorkspacePage>;
}

function sessionPayload(record: SessionRecord, status: "active" | "cancelled"): SessionSavePayload {
  return {
    title: record.title,
    programUuid: record.programUuid,
    masterUuid: record.masterUuid,
    daysOfWeek: record.daysOfWeek,
    startTime: record.startTime,
    endTime: record.endTime,
    venue: record.venue,
    maxCapacity: record.maxCapacity,
    isApprovedPublic: record.isApprovedPublic,
    status,
    revision: record.revision
  };
}
