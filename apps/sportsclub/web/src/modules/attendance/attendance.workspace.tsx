"use client";
import { useDeferredValue, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { AttendanceForm } from "./attendance.form";
import { attendanceQueryKeys, useAttendancePage, useAttendanceDetails } from "./attendance.hooks";
import { AttendanceList } from "./attendance.list";
import { markAttendance, updateAttendance, deleteAttendance } from "./attendance.services";
import type {
  AttendanceColumnFilters,
  AttendanceRecord,
  AttendanceSavePayload
} from "./attendance.types";
const pageSize = 100;
export function AttendanceWorkspace({
  mode = "list",
  uuid,
  onNavigate
}: {
  mode?: "list" | "new" | "edit";
  uuid?: string;
  onNavigate?: (options: { mode?: "list" | "new" | "view" | "edit"; uuid?: string }) => void;
} = {}) {
  const client = useQueryClient();
  const [localMode, setLocalMode] = useState<"list" | "new" | "edit">("list");
  const [localRecord, setLocalRecord] = useState<AttendanceRecord | null>(null);
  const currentMode = onNavigate ? mode : localMode;
  const currentUuid = uuid ?? localRecord?.uuid;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [columnFilters, setColumnFilters] = useState<AttendanceColumnFilters>({});
  const [attendanceDate, setAttendanceDate] = useState("");

  const deferredSearch = useDeferredValue(search);
  const deferredFilters = useDeferredValue(columnFilters);
  const query = useAttendancePage({
    page,
    pageSize,
    search: deferredSearch.trim(),
    status,
    columnFilters: deferredFilters,
    ...(attendanceDate ? { attendanceDate } : {})
  });
  const detail = useAttendanceDetails(currentMode === "edit" ? currentUuid : undefined);
  const editing = currentMode === "edit" ? (detail.data ?? localRecord) : null;
  function navigate(next: "list" | "new" | "edit", record?: AttendanceRecord) {
    if (onNavigate) onNavigate({ mode: next, ...(record ? { uuid: record.uuid } : {}) });
    else {
      setLocalMode(next);
      setLocalRecord(record ?? null);
    }
  }
  const create = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      toast.success("Record created");
      void client.invalidateQueries({ queryKey: attendanceQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const update = useMutation({
    mutationFn: ({
      record,
      payload
    }: {
      record: AttendanceRecord;
      payload: AttendanceSavePayload;
    }) => updateAttendance(record.uuid, payload),
    onSuccess: () => {
      toast.success("Record updated");
      void client.invalidateQueries({ queryKey: attendanceQueryKeys.all });
      navigate("list");
    },
    onError: (error: Error) => toast.error(error.message)
  });
  const remove = useMutation({
    mutationFn: (record: AttendanceRecord) => deleteAttendance(record.uuid),
    onSuccess: () => {
      toast.success("Record deleted");
      void client.invalidateQueries({ queryKey: attendanceQueryKeys.all });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  function changeColumnFilter(key: keyof AttendanceColumnFilters, value: string) {
    setColumnFilters((current) => ({ ...current, [key]: value || undefined }));
    setPage(1);
  }
  if (currentMode === "edit" && !editing)
    return (
      <WorkspacePage title="" variant="list">
        <p role={detail.error ? "alert" : "status"} className="text-sm text-muted-foreground">
          {detail.error?.message ?? "Loading record…"}
        </p>
      </WorkspacePage>
    );
  if (currentMode !== "list")
    return (
      <WorkspacePage title="" variant="list">
        <AttendanceForm
          key={editing?.uuid ?? "new"}
          formId="sportsclub-attendance-form"
          initialRecord={editing}
          isSaving={create.isPending || update.isPending}
          onSubmit={(payload) =>
            editing ? update.mutate({ record: editing, payload }) : create.mutate(payload)
          }
          onCancel={() => navigate("list")}
        />
      </WorkspacePage>
    );
  const total = query.data?.total ?? 0;
  return (
    <WorkspacePage title="" variant="list">
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search remarks or recording actor"
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        filterOptions={[
          { id: "all", label: "All statuses" },
          { id: "present", label: "Present" },
          { id: "absent", label: "Absent" },
          { id: "excused", label: "Excused" },
          { id: "late", label: "Late" }
        ]}
        toolbarAction={
          <Button
            type="button"
            variant={showInlineFilters ? "default" : "outline"}
            aria-label="Toggle column filters"
            aria-pressed={showInlineFilters}
            onClick={() => setShowInlineFilters(!showInlineFilters)}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        }
        columnOptions={[
          {
            id: "attendanceDate",
            label: "Date",
            checked: visibleColumns.attendanceDate !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, attendanceDate: checked }))
          },
          {
            id: "memberUuid",
            label: "Student ID",
            checked: visibleColumns.memberUuid !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, memberUuid: checked }))
          },
          {
            id: "sessionUuid",
            label: "Session ID",
            checked: visibleColumns.sessionUuid !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, sessionUuid: checked }))
          },
          {
            id: "status",
            label: "Status",
            checked: visibleColumns.status !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, status: checked }))
          },
          {
            id: "remarks",
            label: "Remarks",
            checked: visibleColumns.remarks !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, remarks: checked }))
          },
          {
            id: "recordedBy",
            label: "Recorded by",
            checked: visibleColumns.recordedBy !== false,
            onCheckedChange: (checked: boolean) =>
              setVisibleColumns((current) => ({ ...current, recordedBy: checked }))
          }
        ]}
        onShowAllColumns={() => setVisibleColumns({})}
      />
      <label className="flex items-center gap-2 text-sm">
        Date{" "}
        <Input
          type="date"
          value={attendanceDate}
          onChange={(event) => {
            setAttendanceDate(event.target.value);
            setPage(1);
          }}
          className="h-8 w-44"
        />
      </label>
      {query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <AttendanceList
        records={query.data?.items ?? []}
        isLoading={query.isLoading}
        visibleColumns={visibleColumns}
        onView={(record) => navigate("edit", record)}
        onEdit={(record) => navigate("edit", record)}
        onDelete={(record) => remove.mutate(record)}
        filterRow={
          showInlineFilters
            ? (id) => {
                if (id === "attendanceDate")
                  return (
                    <Input
                      aria-label="Filter attendanceDate"
                      type="date"
                      value={columnFilters.attendanceDate ?? ""}
                      onChange={(event) => changeColumnFilter("attendanceDate", event.target.value)}
                      className="h-8"
                    />
                  );
                if (id === "status")
                  return (
                    <select
                      aria-label="Filter status"
                      value={columnFilters.status ?? ""}
                      onChange={(event) => changeColumnFilter("status", event.target.value)}
                      className="h-8 w-full rounded-md border bg-white px-2 text-sm"
                    >
                      <option value="">All</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excused</option>
                      <option value="late">Late</option>
                    </select>
                  );
                return null;
              }
            : undefined
        }
      />
      {total > pageSize ? (
        <WorkspacePagination
          page={page}
          totalPages={Math.ceil(total / pageSize)}
          totalCount={total}
          rowsPerPage={pageSize}
          onPageChange={setPage}
          onRowsPerPageChange={() => undefined}
          singularLabel="entry"
          showingLabel={buildShowingLabel(page, pageSize, total)}
        />
      ) : null}
    </WorkspacePage>
  );
}
