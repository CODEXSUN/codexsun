"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { ProgramForm } from "./program.form";
import { programQueryKeys, useProgramsPage } from "./program.hooks";
import { ProgramList } from "./program.list";
import {
  createProgram,
  restoreProgram,
  suspendProgram,
  updateProgram
} from "./program.services";
import type { ProgramRecord, ProgramSavePayload } from "./program.types";

export function ProgramWorkspace() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useProgramsPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: ProgramRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<ProgramRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: ProgramSavePayload) => createProgram(payload),
    onSuccess: () => {
      toast.success("Discipline program created successfully");
      queryClient.invalidateQueries({ queryKey: programQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create discipline program");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: ProgramSavePayload;
      revision: number;
    }) => updateProgram(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Discipline program updated");
      queryClient.invalidateQueries({ queryKey: programQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update discipline program");
    }
  });

  const suspendMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      suspendProgram(uuid, revision),
    onSuccess: () => {
      toast.success("Discipline program deactivated");
      queryClient.invalidateQueries({ queryKey: programQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to deactivate discipline program");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      restoreProgram(uuid, revision),
    onSuccess: () => {
      toast.success("Discipline program activated");
      queryClient.invalidateQueries({ queryKey: programQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to activate discipline program");
    }
  });

  const handleSave = (payload: ProgramSavePayload) => {
    if (upsertState.record) {
      updateMutation.mutate({
        uuid: upsertState.record.uuid,
        payload,
        revision: upsertState.record.revision
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const records = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <WorkspacePage
      title="Disciplines & Programs / பாடத்திட்டங்கள்"
      description="Silambam, Varma Kalai, and traditional martial arts curriculum definitions and public presentation"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Add Discipline</span>
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search discipline title, slug, or category..."
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
      />

      <ProgramList
        records={records}
        isLoading={isLoading}
        onView={(record) => setViewRecord(record)}
        onEdit={(record) => setUpsertState({ open: true, record })}
        onSuspend={(record) =>
          suspendMutation.mutate({ uuid: record.uuid, revision: record.revision })
        }
        onRestore={(record) =>
          restoreMutation.mutate({ uuid: record.uuid, revision: record.revision })
        }
      />

      <WorkspacePagination
        page={page}
        totalPages={totalPages}
        totalCount={total}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        singularLabel="discipline"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Discipline Details" : "Create Discipline Program"}
        description="Configure martial arts curriculum, category, grading progression, and public exposure."
      >
        <ProgramForm
          initialRecord={upsertState.record}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `${viewRecord.title}` : "Discipline Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Category:</span>
                <p className="font-semibold capitalize text-foreground">{viewRecord.category}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Slug:</span>
                <p className="font-mono text-foreground">{viewRecord.slug}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Grading Levels:</span>
                <p className="text-foreground">{viewRecord.skillLevels}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Public Website:</span>
                <p className="font-medium text-foreground">
                  {viewRecord.isApprovedPublic ? "Publicly Discoverable" : "Internal only"}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-sm">
              <span className="text-xs font-semibold text-foreground">Description & Syllabus</span>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{viewRecord.description}</p>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="button" variant="outline" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </WorkspaceUpsertDialog>
    </WorkspacePage>
  );
}
