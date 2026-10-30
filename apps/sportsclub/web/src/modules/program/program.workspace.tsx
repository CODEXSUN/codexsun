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
import { ProgramForm } from "./program.form";
import { programQueryKeys, useProgramDetails, useProgramsPage } from "./program.hooks";
import { ProgramList } from "./program.list";
import { createProgram, deleteProgram, updateProgram } from "./program.services";
import type { ProgramColumnFilters, ProgramRecord, ProgramSavePayload } from "./program.types";

const columnOptions = [
  { id: "code", label: "Program Code" },
  { id: "name", label: "Program / Curriculum" },
  { id: "discipline", label: "Discipline" },
  { id: "level", label: "Skill Level" },
  { id: "ageGroup", label: "Age Group" },
  { id: "isApprovedPublic", label: "Public Status" },
  { id: "status", label: "Status" }
];

export type ProgramWorkspaceProps = {
  mode?: "list" | "new" | "view" | "edit" | undefined;
  uuid?: string | undefined;
  onNavigate?:
    | ((options: {
        mode?: "list" | "new" | "view" | "edit" | undefined;
        uuid?: string | undefined;
      }) => void)
    | undefined;
  initialCreate?: boolean | undefined;
  onCloseCreate?: (() => void) | undefined;
};

export function ProgramWorkspace({
  mode = "list",
  uuid,
  onNavigate,
  initialCreate = false,
  onCloseCreate
}: ProgramWorkspaceProps) {
  const queryClient = useQueryClient();
  const [internalEditing, setInternalEditing] = useState<ProgramRecord | null | undefined>(
    initialCreate || mode === "new" ? null : undefined
  );
  const [internalViewRecord, setInternalViewRecord] = useState<ProgramRecord | null>(null);

  const [search, setSearch] = useState("");
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ProgramColumnFilters>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  const deferredSearch = useDeferredValue(search);
  const deferredColumnFilters = useDeferredValue(columnFilters);

  const { data, isLoading } = useProgramsPage({
    page,
    pageSize: rowsPerPage,
    search: deferredSearch.trim(),
    status: statusFilter,
    columnFilters: deferredColumnFilters
  });

  const records = data?.items ?? [];

  const targetUuid = mode === "edit" || mode === "view" ? uuid : undefined;
  const { data: fetchedProgram } = useProgramDetails(targetUuid);
  const routedRecord =
    records.find((r) => r.uuid === targetUuid) ?? fetchedProgram ?? null;

  const editing =
    mode === "new"
      ? null
      : mode === "edit" && routedRecord
        ? routedRecord
        : internalEditing;

  const viewRecord =
    mode === "view" && routedRecord ? routedRecord : internalViewRecord;

  const createMutation = useMutation({
    mutationFn: (payload: ProgramSavePayload) => createProgram(payload),
    onSuccess: () => {
      toast.success("Curriculum program created successfully");
      queryClient.invalidateQueries({ queryKey: programQueryKeys.all });
      setInternalEditing(undefined);
      if (onNavigate) onNavigate({ mode: "list" });
      if (initialCreate) onCloseCreate?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create program");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      targetUuid,
      payload,
      revision
    }: {
      targetUuid: string;
      payload: ProgramSavePayload;
      revision: number;
    }) => updateProgram(targetUuid, payload, revision),
    onSuccess: () => {
      toast.success("Curriculum program updated");
      queryClient.invalidateQueries({ queryKey: programQueryKeys.all });
      setInternalEditing(undefined);
      if (onNavigate) onNavigate({ mode: "list" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update program");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (record: ProgramRecord) => deleteProgram(record.uuid),
    onSuccess: () => {
      toast.success("Program removed");
      queryClient.invalidateQueries({ queryKey: programQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove program");
    }
  });

  const handleSave = (payload: ProgramSavePayload) => {
    if (editing) {
      updateMutation.mutate({
        targetUuid: editing.uuid,
        payload,
        revision: editing.revision
      });
    } else {
      createMutation.mutate(payload);
    }
  };


  const handleOpenEdit = (record: ProgramRecord) => {
    if (onNavigate) {
      onNavigate({ mode: "edit", uuid: record.uuid });
    } else {
      setInternalEditing(record);
    }
  };

  const handleOpenView = (record: ProgramRecord) => {
    if (onNavigate) {
      onNavigate({ mode: "view", uuid: record.uuid });
    } else {
      setInternalViewRecord(record);
    }
  };

  const handleCloseUpsert = () => {
    setInternalEditing(undefined);
    if (onNavigate) onNavigate({ mode: "list" });
    if (initialCreate) onCloseCreate?.();
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const activeColumnFilters = Object.values(columnFilters).filter((v) => v?.trim()).length;

  // FULL-PAGE UPSERT (NO POPUP)
  if (editing !== undefined) {
    return (
      <ProgramForm
        key={editing?.uuid ?? "new"}
        initialRecord={editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.message ?? updateMutation.error?.message ?? null}
        onSubmit={handleSave}
        onBack={handleCloseUpsert}
      />
    );
  }

  // LIST VIEW: Headerless canvas, actions portalled to Platform header
  return (
    <WorkspacePage variant="list" title="" technicalName="page.sportsclub.programs.list">
      {/* Platform Header Action Binding */}

      {/* CRM Filter & Column Toolbar */}
      <WorkspaceFilters
        toolbarAction={
          <Button
            aria-label="Toggle column search filters"
            aria-pressed={showInlineFilters}
            className="h-8 min-w-8 gap-1 px-2"
            title="Toggle column search filters"
            type="button"
            variant={showInlineFilters ? "default" : "outline"}
            onClick={() => setShowInlineFilters((open) => !open)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {activeColumnFilters > 0 ? (
              <span className="text-xs">{activeColumnFilters}</span>
            ) : null}
          </Button>
        }
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search curriculum name, code, or discipline..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Programs" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" }
        ]}
        columnOptions={columnOptions.map((column) => ({
          id: column.id,
          label: column.label,
          checked: visibleColumns[column.id] !== false,
          onCheckedChange: (checked: boolean) => {
            setVisibleColumns((current) => ({ ...current, [column.id]: checked }));
            if (!checked) {
              setColumnFilters((current) => {
                const next = { ...current };
                delete next[column.id as keyof ProgramColumnFilters];
                return next;
              });
              setPage(1);
            }
          }
        }))}
        onShowAllColumns={() => setVisibleColumns({})}
      />

      {/* Program Data List */}
      <ProgramList
        records={records}
        isLoading={isLoading}
        visibleColumns={visibleColumns}
        showInlineFilters={showInlineFilters}
        columnFilters={columnFilters}
        onColumnFilterChange={(column, val) => {
          setColumnFilters((prev) => ({ ...prev, [column]: val }));
          setPage(1);
        }}
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDelete={(record) => {
          if (confirm(`Remove program "${record.name}"?`)) {
            deleteMutation.mutate(record);
          }
        }}
      />

      {/* Conditional Server Pagination: Only rendered when total > 100 */}
      {total > 100 ? (
        <WorkspacePagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(currentPage, rowsPerPage, total)}
          singularLabel="program"
          totalCount={total}
          totalPages={totalPages}
          onNextPage={() => setPage((v) => Math.min(totalPages, v + 1))}
          onPageChange={setPage}
          onPreviousPage={() => setPage((v) => Math.max(1, v - 1))} onRowsPerPageChange={() => undefined}
        />
      ) : null}

      {/* Detail Drawer */}
      {viewRecord ? (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{viewRecord.name}</h3>
              <p className="text-xs text-muted-foreground">{viewRecord.code}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setInternalViewRecord(null);
                if (onNavigate) onNavigate({ mode: "list" });
              }}
            >
              Close
            </Button>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Discipline:</span>
              <p className="font-medium text-foreground">{viewRecord.discipline}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Skill Level:</span>
              <p className="capitalize text-foreground">{viewRecord.level.replace("_", " ")}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Target Age Group:</span>
              <p className="text-foreground">{viewRecord.ageGroup || "All ages"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Public Website Listing:</span>
              <p className="text-foreground">
                {viewRecord.isApprovedPublic ? "Approved for Public Site" : "Internal Academy Only"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Description / Syllabus:</span>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {viewRecord.description || "No description provided."}
              </p>
            </div>
          </div>
          <div className="mt-auto flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const rec = viewRecord;
                setInternalViewRecord(null);
                handleOpenEdit(rec);
              }}
            >
              Edit Curriculum
            </Button>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
