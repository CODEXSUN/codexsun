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
import { MasterForm } from "./master.form";
import { masterQueryKeys, useMasterDetails, useMastersPage } from "./master.hooks";
import { MasterList } from "./master.list";
import { createMaster, deleteMaster, updateMaster } from "./master.services";
import type { MasterColumnFilters, MasterRecord, MasterSavePayload } from "./master.types";

const columnOptions = [
  { id: "name", label: "Master / Instructor" },
  { id: "primaryDiscipline", label: "Discipline" },
  { id: "contact", label: "Contact Details" },
  { id: "experienceYears", label: "Experience" },
  { id: "isApprovedPublic", label: "Showcase" },
  { id: "status", label: "Status" }
];

export type MasterWorkspaceProps = {
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

export function MasterWorkspace({
  mode = "list",
  uuid,
  onNavigate,
  initialCreate = false,
  onCloseCreate
}: MasterWorkspaceProps) {
  const queryClient = useQueryClient();
  const [internalEditing, setInternalEditing] = useState<MasterRecord | null | undefined>(
    initialCreate || mode === "new" ? null : undefined
  );
  const [internalViewRecord, setInternalViewRecord] = useState<MasterRecord | null>(null);

  const [search, setSearch] = useState("");
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<MasterColumnFilters>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  const deferredSearch = useDeferredValue(search);
  const deferredColumnFilters = useDeferredValue(columnFilters);

  const { data, isLoading } = useMastersPage({
    page,
    pageSize: rowsPerPage,
    search: deferredSearch.trim(),
    status: statusFilter,
    columnFilters: deferredColumnFilters
  });

  const records = data?.items ?? [];

  const targetUuid = mode === "edit" || mode === "view" ? uuid : undefined;
  const { data: fetchedMaster } = useMasterDetails(targetUuid);
  const routedRecord =
    records.find((r) => r.uuid === targetUuid) ?? fetchedMaster ?? null;

  const editing =
    mode === "new"
      ? null
      : mode === "edit" && routedRecord
        ? routedRecord
        : internalEditing;

  const viewRecord =
    mode === "view" && routedRecord ? routedRecord : internalViewRecord;

  const createMutation = useMutation({
    mutationFn: (payload: MasterSavePayload) => createMaster(payload),
    onSuccess: () => {
      toast.success("Master instructor registered successfully");
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.all });
      setInternalEditing(undefined);
      if (onNavigate) onNavigate({ mode: "list" });
      if (initialCreate) onCloseCreate?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to register master");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      targetUuid,
      payload,
      revision
    }: {
      targetUuid: string;
      payload: MasterSavePayload;
      revision: number;
    }) => updateMaster(targetUuid, payload, revision),
    onSuccess: () => {
      toast.success("Master profile updated");
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.all });
      setInternalEditing(undefined);
      if (onNavigate) onNavigate({ mode: "list" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update master");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (record: MasterRecord) => deleteMaster(record.uuid),
    onSuccess: () => {
      toast.success("Master profile removed");
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove master");
    }
  });

  const handleSave = (payload: MasterSavePayload) => {
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


  const handleOpenEdit = (record: MasterRecord) => {
    if (onNavigate) {
      onNavigate({ mode: "edit", uuid: record.uuid });
    } else {
      setInternalEditing(record);
    }
  };

  const handleOpenView = (record: MasterRecord) => {
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
      <MasterForm
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
    <WorkspacePage variant="list" title="" technicalName="page.sportsclub.masters.list">
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
        searchPlaceholder="Search master name, email, or discipline..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Masters" },
          { id: "active", label: "Active" },
          { id: "suspended", label: "Suspended" }
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
                delete next[column.id as keyof MasterColumnFilters];
                return next;
              });
              setPage(1);
            }
          }
        }))}
        onShowAllColumns={() => setVisibleColumns({})}
      />

      {/* Master Data List */}
      <MasterList
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
          if (confirm(`Remove instructor "${record.name}"?`)) {
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
          singularLabel="master"
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
              <p className="text-xs text-muted-foreground">{viewRecord.title}</p>
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
              <p className="font-medium text-foreground">{viewRecord.primaryDiscipline}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Email:</span>
              <p className="text-foreground">{viewRecord.email}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Phone:</span>
              <p className="font-mono text-foreground">{viewRecord.phone || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Experience:</span>
              <p className="text-foreground">{viewRecord.experienceYears} Years</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Public Biography:</span>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {viewRecord.publicBio || "No biography provided."}
              </p>
            </div>
            {viewRecord.privateNotes ? (
              <div className="rounded border bg-muted/20 p-2.5 text-xs">
                <span className="font-semibold text-foreground">Internal Notes:</span>
                <p className="mt-1 text-muted-foreground">{viewRecord.privateNotes}</p>
              </div>
            ) : null}
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
              Edit Master
            </Button>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
