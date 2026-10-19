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
import { SessionForm } from "./session.form";
import { sessionQueryKeys, useSessionsPage } from "./session.hooks";
import { SessionList } from "./session.list";
import {
  createSession,
  restoreSession,
  suspendSession,
  updateSession
} from "./session.services";
import type { SessionRecord, SessionSavePayload } from "./session.types";

export function SessionWorkspace({
  programOptions = [],
  masterOptions = []
}: {
  programOptions?: Array<{ label: string; value: string }>;
  masterOptions?: Array<{ label: string; value: string }>;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useSessionsPage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: SessionRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<SessionRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: SessionSavePayload) => createSession(payload),
    onSuccess: () => {
      toast.success("Training session scheduled successfully");
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to schedule session");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: SessionSavePayload;
      revision: number;
    }) => updateSession(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Session schedule updated");
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update session");
    }
  });

  const suspendMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      suspendSession(uuid, revision),
    onSuccess: () => {
      toast.success("Session deactivated");
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to deactivate session");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      restoreSession(uuid, revision),
    onSuccess: () => {
      toast.success("Session activated");
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to activate session");
    }
  });

  const handleSave = (payload: SessionSavePayload) => {
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
      title="Training Sessions & Batches / பயிற்சி வகுப்புகள்"
      description="Class timetables, venues, assigned masters, and enrollment rosters"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>New Batch</span>
        </Button>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search session title, venue, or day..."
        filterValue={statusFilter}
        onFilterValueChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All Sessions" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" }
        ]}
      />

      <SessionList
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
        singularLabel="session"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Batch Schedule" : "Create Session Batch"}
        description="Set training schedule, venue ground, assigned asan, and student limit."
      >
        <SessionForm
          initialRecord={upsertState.record}
          programOptions={programOptions}
          masterOptions={masterOptions}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `${viewRecord.title}` : "Session Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Discipline:</span>
                <p className="font-semibold text-foreground">{viewRecord.programTitle ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Instructor / ஆசான்:</span>
                <p className="font-semibold text-foreground">{viewRecord.masterName ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Days:</span>
                <p className="text-foreground">{viewRecord.dayOfWeek}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Timings:</span>
                <p className="text-foreground">
                  {viewRecord.startTime} – {viewRecord.endTime}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Venue:</span>
                <p className="text-foreground">{viewRecord.venue}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Enrolled Students:</span>
                <p className="text-foreground">
                  {viewRecord.enrolledStudentsCount ?? 0} / {viewRecord.maxCapacity} Max
                </p>
              </div>
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
