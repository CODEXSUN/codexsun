import { useState } from "react";
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
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { attendanceSchema } from "./attendance.schema";
import { useAttendanceEmployees } from "./attendance.hooks";
import type { AttendanceGateway } from "./attendance.services";
import type {
  AttendanceEmployee,
  AttendanceInput,
  AttendanceRecord,
  AttendanceStatus
} from "./attendance.types";

export function AttendanceForm({
  record,
  gateway,
  busy,
  error,
  onCancel,
  onSave
}: {
  record: AttendanceRecord | null;
  gateway: AttendanceGateway;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSave: (input: AttendanceInput) => void;
}) {
  const [value, setValue] = useState<AttendanceInput>(() => ({
    employeeId: record?.employeeId ?? "",
    workDate: record?.workDate ?? localDate(),
    status: record?.status ?? "present",
    checkIn: record?.checkIn ?? "",
    checkOut: record?.checkOut ?? "",
    notes: record?.notes ?? ""
  }));
  const [issue, setIssue] = useState("");
  const employees = useAttendanceEmployees(gateway);
  const options: AttendanceEmployee[] = employees.data ?? [];
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = attendanceSchema.safeParse(value);
        if (!parsed.success) {
          setIssue(parsed.error.issues[0]?.message ?? "Check the attendance details.");
          return;
        }
        setIssue("");
        onSave(parsed.data);
      }}
    >
      {issue || error || employees.error ? (
        <WorkspaceFormBanner title="Unable to save attendance">
          {issue || error || employees.error?.message}
        </WorkspaceFormBanner>
      ) : null}
      <WorkspaceFormGrid columns={2}>
        <WorkspaceFormField label="Employee" required>
          <WorkspaceLookup
            allowTextValue={false}
            loading={employees.isFetching}
            options={options.map((employee) => ({
              value: employee.id,
              label: `${employee.employeeCode} · ${employee.name}`,
              description: employee.department || "No department"
            }))}
            value={value.employeeId}
            onValueChange={(employeeId) => setValue((current) => ({ ...current, employeeId }))}
            placeholder="Select employee"
            showAllOptionsOnFocus
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Date" required>
          <WorkspaceDatePicker
            ariaLabel="Attendance date"
            value={value.workDate}
            onValueChange={(workDate) => setValue((current) => ({ ...current, workDate }))}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Status" required>
          <Select
            value={value.status}
            onValueChange={(status) =>
              setValue((current) => ({
                ...current,
                status: status as AttendanceStatus,
                ...(status === "present" ? {} : { checkIn: "", checkOut: "" })
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
              <SelectItem value="holiday">Holiday</SelectItem>
            </SelectContent>
          </Select>
        </WorkspaceFormField>
        <WorkspaceFormField label="Check in">
          <Input
            type="time"
            disabled={busy || value.status !== "present"}
            value={value.checkIn ?? ""}
            onChange={(event) =>
              setValue((current) => ({ ...current, checkIn: event.target.value }))
            }
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Check out">
          <Input
            type="time"
            disabled={busy || value.status !== "present"}
            value={value.checkOut ?? ""}
            onChange={(event) =>
              setValue((current) => ({ ...current, checkOut: event.target.value }))
            }
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Notes">
          <Input
            maxLength={2000}
            value={value.notes}
            onChange={(event) => setValue((current) => ({ ...current, notes: event.target.value }))}
          />
        </WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter
        className="mt-6 border-t pt-4"
        onCancel={onCancel}
        primaryLabel={record ? "Update" : "Save"}
        primaryLoading={busy}
      />
      <Button className="sr-only" type="submit">
        Save attendance
      </Button>
    </form>
  );
}

function localDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
