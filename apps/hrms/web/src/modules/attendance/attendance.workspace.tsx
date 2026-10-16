import { AttendanceList } from "./attendance.list";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
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
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { attendanceQueryKey, useAttendance } from "./attendance.hooks";
import { AttendanceForm } from "./attendance.form";
import type { AttendanceGateway } from "./attendance.services";
import type { AttendanceFilters, AttendanceInput, AttendanceRecord } from "./attendance.types";

export function AttendanceWorkspace({ gateway }: { gateway: AttendanceGateway }) {
  const client = useQueryClient();
  const [filters, setFilters] = useState<AttendanceFilters>({
    date: localDate(),
    search: "",
    status: "all"
  });
  const [editing, setEditing] = useState<AttendanceRecord | null | undefined>(undefined);
  const [removing, setRemoving] = useState<AttendanceRecord | null>(null);
  const query = useAttendance(gateway, filters);
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
  const rows = query.data ?? [];
  return (
    <WorkspacePage
      title="Attendance"
      description="Record employee attendance by work date and review daily coverage."
      technicalName="page.hrms.attendance"
      actions={
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-4" /> Mark attendance
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="max-w-44"
          aria-label="Attendance date"
          type="date"
          max={utcDate()}
          value={filters.date}
          onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
        />
        <Input
          className="max-w-sm"
          placeholder="Search employee code, name or department"
          value={filters.search}
          onChange={(event) =>
            setFilters((current) => ({ ...current, search: event.target.value }))
          }
        />
        <Select
          value={filters.status}
          onValueChange={(status) =>
            setFilters((current) => ({ ...current, status: status as AttendanceFilters["status"] }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="leave">Leave</SelectItem>
            <SelectItem value="holiday">Holiday</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {query.error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {query.error.message}
        </p>
      ) : null}
      <AttendanceList
        records={rows}
        loading={query.isPending}
        onEdit={setEditing}
        onRestore={(record) => lifecycle.mutate({ record, restore: true })}
        onRemove={setRemoving}
      />
      <WorkspaceUpsertDialog
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? "Edit attendance" : "Mark attendance"}
        description="One record per employee for each work date."
      >
        <AttendanceForm
          key={editing?.id ?? "new"}
          record={editing ?? null}
          gateway={gateway}
          busy={save.isPending}
          error={save.error?.message ?? ""}
          onCancel={() => setEditing(undefined)}
          onSave={(input) => save.mutate(input)}
        />
      </WorkspaceUpsertDialog>
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
