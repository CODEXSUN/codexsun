"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import {
  WorkspaceFormActions,
  WorkspaceFormField,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { attendanceSchema } from "./attendance.schema";
import {
  getAttendanceMember,
  getAttendanceSession,
  searchAttendanceMembers,
  searchAttendanceSessions
} from "./attendance.services";
import type { AttendanceRecord, AttendanceSavePayload, AttendanceStatus } from "./attendance.types";

export function AttendanceForm({
  formId,
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  formId?: string;
  initialRecord?: AttendanceRecord | null;
  isSaving: boolean;
  onSubmit: (payload: AttendanceSavePayload) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<AttendanceSavePayload>({
    sessionUuid: initialRecord?.sessionUuid ?? "",
    memberUuid: initialRecord?.memberUuid ?? "",
    attendanceDate: initialRecord?.attendanceDate ?? new Date().toISOString().slice(0, 10),
    status: initialRecord?.status ?? "present",
    remarks: initialRecord?.remarks ?? ""
  });
  const [sessionSearch, setSessionSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deferredSessionSearch, setDeferredSessionSearch] = useState("");
  const [deferredMemberSearch, setDeferredMemberSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDeferredSessionSearch(sessionSearch), 250);
    return () => clearTimeout(timer);
  }, [sessionSearch]);
  useEffect(() => {
    const timer = setTimeout(() => setDeferredMemberSearch(memberSearch), 250);
    return () => clearTimeout(timer);
  }, [memberSearch]);
  const sessions = useQuery({
    queryKey: ["sportsclub", "attendance", "sessions", deferredSessionSearch],
    queryFn: () => searchAttendanceSessions(deferredSessionSearch)
  });
  const members = useQuery({
    queryKey: ["sportsclub", "attendance", "members", deferredMemberSearch],
    queryFn: () => searchAttendanceMembers(deferredMemberSearch)
  });
  const selectedSession = useQuery({
    queryKey: ["sportsclub", "attendance", "session", value.sessionUuid],
    queryFn: () => getAttendanceSession(value.sessionUuid),
    enabled: Boolean(value.sessionUuid)
  });
  const selectedMember = useQuery({
    queryKey: ["sportsclub", "attendance", "member", value.memberUuid],
    queryFn: () => getAttendanceMember(value.memberUuid),
    enabled: Boolean(value.memberUuid)
  });
  const sessionOptions = [
    ...(sessions.data?.items ?? []),
    ...(selectedSession.data ? [selectedSession.data] : [])
  ]
    .filter((item, index, array) => array.findIndex((other) => other.uuid === item.uuid) === index)
    .map((item) => ({ value: item.uuid, label: item.title }));
  const memberOptions = [
    ...(members.data?.items ?? []),
    ...(selectedMember.data ? [selectedMember.data] : [])
  ]
    .filter(
      (item, index, array) =>
        array.findIndex((other) => other.uuid === item.uuid) === index && item.role === "student"
    )
    .map((item) => ({ value: item.uuid, label: item.name }));
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = attendanceSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }
  return (
    <form id={formId} onSubmit={submit} className="space-y-4">
      <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
      {Object.keys(errors).length ? (
        <p role="alert" className="text-sm text-destructive">
          Correct the highlighted fields.
        </p>
      ) : null}
      {(sessions.error ?? members.error ?? selectedSession.error ?? selectedMember.error) ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load relationship choices. Retry the search.
        </p>
      ) : null}
      <WorkspaceFormSurface className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <WorkspaceFormField label="Session" required>
            <WorkspaceLookup
              value={value.sessionUuid}
              options={sessionOptions}
              onTextChange={setSessionSearch}
              onValueChange={(sessionUuid) => setValue((current) => ({ ...current, sessionUuid }))}
              loading={sessions.isLoading}
              allowTextValue={false}
              placeholder="Search sessions"
            />
            {errors.sessionUuid ? (
              <p className="text-xs text-destructive">{errors.sessionUuid}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Student" required>
            <WorkspaceLookup
              value={value.memberUuid}
              options={memberOptions}
              onTextChange={setMemberSearch}
              onValueChange={(memberUuid) => setValue((current) => ({ ...current, memberUuid }))}
              loading={members.isLoading}
              allowTextValue={false}
              placeholder="Search students"
            />
            {errors.memberUuid ? (
              <p className="text-xs text-destructive">{errors.memberUuid}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Attendance date" required>
            <Input
              type="date"
              value={value.attendanceDate}
              onChange={(event) =>
                setValue((current) => ({ ...current, attendanceDate: event.target.value }))
              }
              disabled={isSaving}
            />
            {errors.attendanceDate ? (
              <p className="text-xs text-destructive">{errors.attendanceDate}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Status" required>
            <WorkspaceSelect
              value={value.status}
              onValueChange={(status) =>
                setValue((current) => ({ ...current, status: status as AttendanceStatus }))
              }
              options={[
                { label: "Present", value: "present" },
                { label: "Absent", value: "absent" },
                { label: "Excused", value: "excused" },
                { label: "Late", value: "late" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>
        <WorkspaceFormField label="Remarks">
          <Textarea
            value={value.remarks}
            onChange={(event) =>
              setValue((current) => ({ ...current, remarks: event.target.value }))
            }
            maxLength={500}
            disabled={isSaving}
          />
          {errors.remarks ? <p className="text-xs text-destructive">{errors.remarks}</p> : null}
        </WorkspaceFormField>
      </WorkspaceFormSurface>
      <WorkspaceFormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
