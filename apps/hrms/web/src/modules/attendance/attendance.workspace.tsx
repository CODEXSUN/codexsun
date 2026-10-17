import { useWorkspaceQueryState, useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { AttendanceList, attendanceListColumns } from "./attendance.list";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@codexsun/ui/components/alert-dialog";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { attendanceQueryKey, useAttendance } from "./attendance.hooks";
import { AttendanceForm } from "./attendance.form";
import type { AttendanceGateway } from "./attendance.services";
import type { AttendanceFilters, AttendanceInput, AttendanceRecord } from "./attendance.types";

export function AttendanceWorkspace({ gateway }: { gateway: AttendanceGateway }) {
  const listTools = useWorkspaceListTools(attendanceListColumns);
  const client = useQueryClient();
  const [filters, setFilters] = useWorkspaceQueryState<AttendanceFilters>({
    date: localDate(),
    search: "",
    status: "all"
  });

  const [removing, setRemoving] = useState<AttendanceRecord | null>(null);
  const query = useAttendance(gateway, filters);
  const [editing, setEditing] = useWorkspaceRecordSelection<AttendanceRecord>(query.data ?? [], (record) => String(record.id));
  const save = useMutation({
    mutationFn: (input: AttendanceInput) =>
      editing ? gateway.update(editing.id, input) : gateway.create(input),
    onSuccess: async (record) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: attendanceQueryKey }),
        client.invalidateQueries({ queryKey: ["hrms", "overview"] })
      ]);
      toast.success("Attendance saved", {
        description: `${record.employeeCode} · ${record.workDate}`
      });
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save attendance", { description: error.message })
  });
  const lifecycle = useMutation({
    mutationFn: ({ record, restore }: { record: AttendanceRecord; restore: boolean }) =>
      restore ? gateway.restore(record.id) : gateway.remove(record.id),
    onSuccess: async (_, action) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: attendanceQueryKey }),
        client.invalidateQueries({ queryKey: ["hrms", "overview"] })
      ]);
      toast.success(action.restore ? "Attendance restored" : "Attendance removed");
      setRemoving(null);
    },
    onError: (error) => toast.error("Unable to update attendance", { description: error.message })
  });
  const rows = (query.data ?? []).filter((record) => listTools.matches(record));
  if (editing !== undefined) return <WorkspacePage title={editing ? "Edit attendance" : "Mark attendance"} onBack={() => setEditing(undefined)}><AttendanceForm
          key={editing?.id ?? "new"}
          record={editing ?? null}
          gateway={gateway}
          busy={save.isPending}
          error={save.error?.message ?? ""}
          onCancel={() => setEditing(undefined)}
          onSave={(input) => save.mutate(input)}
        /></WorkspacePage>;
  return (
    <WorkspacePage variant="list"
      title="Attendance"
      description="Record employee attendance by work date and review daily coverage."
      technicalName="page.hrms.attendance"
      actions={
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-4" /> Mark attendance
        </Button>
      }
    >
      <WorkspaceFilters
        searchPlaceholder="Search employee code, name or department"
        searchValue={filters.search}
        onSearchValueChange={(search) => setFilters((current) => ({ ...current, search }))}
        filterValue={filters.status}
        filterOptions={[{id:"all",label:"All statuses"},{ id:"present",label:"Present",count:(query.data ?? []).filter((record) => record.status === "present").length },{ id:"absent",label:"Absent",count:(query.data ?? []).filter((record) => record.status === "absent").length },{ id:"leave",label:"Leave",count:(query.data ?? []).filter((record) => record.status === "leave").length },{ id:"holiday",label:"Holiday",count:(query.data ?? []).filter((record) => record.status === "holiday").length }]}
        onFilterValueChange={(status) => setFilters((current) => ({ ...current, status: status as AttendanceFilters["status"] }))}
        columnOptions={listTools.columnOptions}
        onShowAllColumns={listTools.onShowAllColumns}
        toolbarAction={<>{listTools.toolbarAction}<Input
          className="max-w-44"
          aria-label="Attendance date"
          type="date"
          max={utcDate()}
          value={filters.date}
          onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
        /></>}
      />
      {query.error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <AttendanceList
        listTools={listTools}        records={rows}
        loading={query.isPending}
        onEdit={setEditing}
        onRestore={(record) => lifecycle.mutate({ record, restore: true })}
        onRemove={setRemoving}
      />

      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove attendance record?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing
                ? `${removing.employeeCode} attendance for ${removing.workDate} will be removed from current records.`
                : "This attendance record will be removed from current records."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={lifecycle.isPending}
              onClick={() => removing && lifecycle.mutate({ record: removing, restore: false })}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePage>
  );
}

function localDate() {
  return utcDate();
}

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}
