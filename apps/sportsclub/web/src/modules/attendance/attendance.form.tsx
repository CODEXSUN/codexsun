"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  WorkspaceFormActions,
  WorkspaceFormField,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { attendanceSchema } from "./attendance.schema";
import type { AttendanceRecord, AttendanceSavePayload, AttendanceStatus } from "./attendance.types";

const todayString = () => new Date().toISOString().split("T")[0]!;

export function AttendanceForm({
  initialRecord,
  sessionOptions = [],
  studentOptions = [],
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: AttendanceRecord | null;
  sessionOptions?: Array<{ label: string; value: string }>;
  studentOptions?: Array<{ label: string; value: string }>;
  isSaving: boolean;
  onSubmit: (payload: AttendanceSavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<AttendanceSavePayload>(() =>
    initialRecord
      ? {
          sessionUuid: initialRecord.sessionUuid,
          memberUuid: initialRecord.memberUuid,
          sessionDate: initialRecord.sessionDate,
          status: initialRecord.status,
          notes: initialRecord.notes ?? ""
        }
      : {
          sessionUuid: sessionOptions[0]?.value ?? "",
          memberUuid: studentOptions[0]?.value ?? "",
          sessionDate: todayString(),
          status: "present",
          notes: ""
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        sessionUuid: initialRecord.sessionUuid,
        memberUuid: initialRecord.memberUuid,
        sessionDate: initialRecord.sessionDate,
        status: initialRecord.status,
        notes: initialRecord.notes ?? ""
      });
    } else if (sessionOptions.length > 0 || studentOptions.length > 0) {
      setFormData((prev) => ({
        ...prev,
        sessionUuid: prev.sessionUuid || (sessionOptions[0]?.value ?? ""),
        memberUuid: prev.memberUuid || (studentOptions[0]?.value ?? "")
      }));
    }
  }, [initialRecord, sessionOptions, studentOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = attendanceSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.keys(errors).length > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>Please correct the highlighted fields before saving.</span>
        </div>
      ) : null}

      <WorkspaceFormSurface className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WorkspaceFormField label="Session / Batch" required={true}>
            <WorkspaceSelect
              value={formData.sessionUuid}
              onValueChange={(val) => setFormData({ ...formData, sessionUuid: val })}
              options={sessionOptions}
              disabled={isSaving}
            />
            {errors.sessionUuid ? (
              <span className="text-xs text-destructive">{errors.sessionUuid}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Student / Member" required={true}>
            <WorkspaceSelect
              value={formData.memberUuid}
              onValueChange={(val) => setFormData({ ...formData, memberUuid: val })}
              options={studentOptions}
              disabled={isSaving}
            />
            {errors.memberUuid ? (
              <span className="text-xs text-destructive">{errors.memberUuid}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Session Date" required={true}>
            <Input
              type="date"
              value={formData.sessionDate}
              onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
              disabled={isSaving}
            />
            {errors.sessionDate ? (
              <span className="text-xs text-destructive">{errors.sessionDate}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Attendance Status" required={true}>
            <WorkspaceSelect
              value={formData.status}
              onValueChange={(val) =>
                setFormData({ ...formData, status: val as AttendanceStatus })
              }
              options={[
                { label: "Present / வருகை", value: "present" },
                { label: "Absent / வரவில்லை", value: "absent" },
                { label: "Late / தாமதம்", value: "late" },
                { label: "Excused / அனுமதி பெற்றவர்", value: "excused" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>

        <WorkspaceFormField label="Notes / Reason">
          <Textarea
            value={formData.notes ?? ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            placeholder="e.g. Attended special stick rotation sparring, or reason for absence"
            disabled={isSaving}
            rows={2}
          />
          {errors.notes ? <span className="text-xs text-destructive">{errors.notes}</span> : null}
        </WorkspaceFormField>
      </WorkspaceFormSurface>

      <WorkspaceFormActions>
        <Button type="submit" disabled={isSaving}>
          {initialRecord ? "Update Log" : "Mark Attendance"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
