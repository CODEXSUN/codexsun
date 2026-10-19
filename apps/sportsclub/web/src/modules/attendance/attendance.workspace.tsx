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
import { AttendanceForm } from "./attendance.form";
import { attendanceQueryKeys, useAttendancePage } from "./attendance.hooks";
import { AttendanceList } from "./attendance.list";
import {
  deleteAttendance,
  markAttendance,
  updateAttendance
} from "./attendance.services";
import type { AttendanceRecord, AttendanceSavePayload } from "./attendance.types";

export function AttendanceWorkspace({
  sessionOptions = [],
  studentOptions = []
}: {
  sessionOptions?: Array<{ label: string; value: string }>;
  studentOptions?: Array<{ label: string; value: string }>;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionDate, setSessionDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useAttendancePage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status: statusFilter,
    sessionDate: sessionDate || undefined
  });

  const [upsertState, setUpsertState] = useState<{
    open: boolean;
    record: AttendanceRecord | null;
  }>({
    open: false,
    record: null
  });

  const [viewRecord, setViewRecord] = useState<AttendanceRecord | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: AttendanceSavePayload) => markAttendance(payload),
    onSuccess: () => {
      toast.success("Attendance marked successfully");
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to mark attendance");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
      revision
    }: {
      uuid: string;
      payload: AttendanceSavePayload;
      revision: number;
    }) => updateAttendance(uuid, payload, revision),
    onSuccess: () => {
      toast.success("Attendance entry updated");
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
      setUpsertState({ open: false, record: null });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update attendance");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ uuid, revision }: { uuid: string; revision: number }) =>
      deleteAttendance(uuid, revision),
    onSuccess: () => {
      toast.success("Attendance entry removed");
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove attendance");
    }
  });

  const handleSave = (payload: AttendanceSavePayload) => {
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
      title="Daily Attendance / வருகைப் பதிவு"
      description="Session-by-session attendance marking, discipline adherence, and student activity logs"
      action={
        <Button
          type="button"
          onClick={() => setUpsertState({ open: true, record: null })}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Mark Attendance</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <WorkspaceFilters
            searchValue={search}
            onSearchValueChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            searchPlaceholder="Search student name, ID, or session..."
            filterValue={statusFilter}
            onFilterValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            filterOptions={[
              { id: "all", label: "All Statuses" },
              { id: "present", label: "Present" },
              { id: "absent", label: "Absent" },
              { id: "late", label: "Late" },
              { id: "excused", label: "Excused" }
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => {
              setSessionDate(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-border/80 bg-white px-2 text-xs shadow-none"
            placeholder="Filter Date"
          />
          {sessionDate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSessionDate("");
                setPage(1);
              }}
              className="h-8 text-xs"
            >
              Clear Date
            </Button>
          ) : null}
        </div>
      </div>

      <AttendanceList
        records={records}
        isLoading={isLoading}
        onView={(record) => setViewRecord(record)}
        onEdit={(record) => setUpsertState({ open: true, record })}
        onDelete={(record) =>
          deleteMutation.mutate({ uuid: record.uuid, revision: record.revision })
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
        singularLabel="entry"
        showingLabel={buildShowingLabel(page, pageSize, total)}
      />

      <WorkspaceUpsertDialog
        open={upsertState.open}
        onClose={() => setUpsertState({ open: false, record: null })}
        title={upsertState.record ? "Edit Attendance Entry" : "Record Class Attendance"}
        description="Select batch, student, date, and attendance status."
      >
        <AttendanceForm
          initialRecord={upsertState.record}
          sessionOptions={sessionOptions}
          studentOptions={studentOptions}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSave}
          onCancel={() => setUpsertState({ open: false, record: null })}
        />
      </WorkspaceUpsertDialog>

      <WorkspaceUpsertDialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `Attendance Log: ${viewRecord.studentName ?? "Student"}` : "Attendance Details"}
      >
        {viewRecord ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Student:</span>
                <p className="font-semibold text-foreground">{viewRecord.studentName ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Batch:</span>
                <p className="font-semibold text-foreground">{viewRecord.sessionTitle ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Date:</span>
                <p className="text-foreground">{viewRecord.sessionDate}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status:</span>
                <p className="font-medium capitalize text-foreground">{viewRecord.status}</p>
              </div>
            </div>

            {viewRecord.notes ? (
              <div className="rounded-md border border-border/80 bg-muted/20 p-3 text-sm">
                <span className="text-xs font-semibold text-foreground">Notes</span>
                <p className="mt-1 text-foreground">{viewRecord.notes}</p>
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
