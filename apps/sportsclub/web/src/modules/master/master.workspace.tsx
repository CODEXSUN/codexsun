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
import { MasterForm } from "./master.form";
import { masterQueryKeys, useMastersPage } from "./master.hooks";
import { MasterList } from "./master.list";
import {
  createMaster,
  restoreMaster,
  suspendMaster,
  updateMaster
} from "./master.services";
import type { MasterRecord, MasterSavePayload } from "./master.types";

export function MasterWorkspace() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useMastersPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: MasterRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<MasterRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: MasterSavePayload) => createMaster(payload),
    onSuccess: () => {
      toast.success("Master profile created successfully");
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create master profile");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: MasterSavePayload;
      revision: number;
    }) => updateMaster(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Master profile updated");
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update master");
    }
  });

  const suspendMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      suspendMaster(uuid, revision),
    onSuccess: () => {
      toast.success("Master profile deactivated");
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to deactivate master");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      restoreMaster(uuid, revision),
    onSuccess: () => {
      toast.success("Master profile activated");
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to activate master");
    }
  });

  const handleSave = (payload: MasterSavePayload) => {
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
      title="Masters & Instructors / ஆசான்கள்"
      description="Gurukulam masters, credentials, discipline specializations, and student supervision"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Add Master Profile</span>
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search master name, title, or specialization..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Masters" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" }
        ]}
      />

      <MasterList
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
        singularLabel="master"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Master Profile" : "Register Master / Asan"}
        description="Enter instructor credentials, discipline specializations, and public profile visibility."
      >
        <MasterForm
          initialRecord={upsertState.record}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `${viewRecord.fullName}` : "Master Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Title:</span>
                <p className="font-semibold text-foreground">{viewRecord.title}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Specialization:</span>
                <p className="font-semibold text-foreground">{viewRecord.specialization}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Experience:</span>
                <p className="text-foreground">
                  {viewRecord.experienceYears ? `${viewRecord.experienceYears} Years` : "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Public Website:</span>
                <p className="font-medium text-foreground">
                  {viewRecord.isApprovedPublic ? "Published on public portal" : "Internal only"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Phone:</span>
                <p className="font-mono text-foreground">{viewRecord.phone ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Email:</span>
                <p className="text-foreground">{viewRecord.email ?? "—"}</p>
              </div>
            </div>

            {viewRecord.biography ? (
              <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-sm">
                <span className="text-xs font-semibold text-foreground">Biography</span>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{viewRecord.biography}</p>
              </div>
            ) : null}

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
