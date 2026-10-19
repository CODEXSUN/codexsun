"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  WorkspaceFormActions,
  WorkspaceFormField,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { sessionSchema } from "./session.schema";
import type { SessionRecord, SessionSavePayload, SessionStatus } from "./session.types";

const defaultPayload: SessionSavePayload = {
  title: "",
  programUuid: "",
  masterUuid: "",
  daysOfWeek: "Mon, Wed, Fri",
  startTime: "06:00 AM",
  endTime: "07:30 AM",
  venue: "Main Gurukulam Ground (களரி அரங்கம்)",
  maxCapacity: 30,
  status: "active"
};

export function SessionForm({
  initialRecord,
  programOptions = [],
  masterOptions = [],
  programSearch = "",
  onProgramSearchChange,
  masterSearch = "",
  onMasterSearchChange,
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: SessionRecord | null;
  programOptions?: Array<{ label: string; value: string }>;
  masterOptions?: Array<{ label: string; value: string }>;
  programSearch?: string;
  onProgramSearchChange?: (value: string) => void;
  masterSearch?: string;
  onMasterSearchChange?: (value: string) => void;
  isSaving: boolean;
  onSubmit: (payload: SessionSavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<SessionSavePayload>(() =>
    initialRecord
      ? {
          title: initialRecord.title,
          programUuid: initialRecord.programUuid,
          masterUuid: initialRecord.masterUuid,
          daysOfWeek: initialRecord.daysOfWeek,
          startTime: initialRecord.startTime,
          endTime: initialRecord.endTime,
          venue: initialRecord.venue,
          maxCapacity: initialRecord.maxCapacity,
          status: initialRecord.status
        }
      : {
          ...defaultPayload,
          programUuid: programOptions[0]?.value ?? "",
          masterUuid: masterOptions[0]?.value ?? ""
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        title: initialRecord.title,
        programUuid: initialRecord.programUuid,
        masterUuid: initialRecord.masterUuid,
        daysOfWeek: initialRecord.daysOfWeek,
        startTime: initialRecord.startTime,
        endTime: initialRecord.endTime,
        venue: initialRecord.venue,
        maxCapacity: initialRecord.maxCapacity,
        status: initialRecord.status
      });
    } else if (programOptions.length > 0 || masterOptions.length > 0) {
      setFormData((prev) => ({
        ...prev,
        programUuid: prev.programUuid || (programOptions[0]?.value ?? ""),
        masterUuid: prev.masterUuid || (masterOptions[0]?.value ?? "")
      }));
    }
  }, [initialRecord, programOptions, masterOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = sessionSchema.safeParse(formData);
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
    <form id="sportsclub-session-form" onSubmit={handleSubmit} className="space-y-4">
      {Object.keys(errors).length > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>Please correct the highlighted fields before saving.</span>
        </div>
      ) : null}

      <WorkspaceFormSurface className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WorkspaceFormField label="Batch / Session Title" required={true}>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Morning Silambam Juniors"
              disabled={isSaving}
            />
            {errors.title ? <span className="text-xs text-destructive">{errors.title}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Discipline / Program" required={true}>
            <Input aria-label="Search curriculum programs" value={programSearch} onChange={(event) => onProgramSearchChange?.(event.target.value)} placeholder="Search programs…" disabled={isSaving} />
            <WorkspaceSelect
              value={formData.programUuid}
              onValueChange={(val) => setFormData({ ...formData, programUuid: val })}
              options={programOptions}
              disabled={isSaving}
            />
            {errors.programUuid ? (
              <span className="text-xs text-destructive">{errors.programUuid}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Instructor / ஆசான்" required={true}>
            <Input aria-label="Search masters" value={masterSearch} onChange={(event) => onMasterSearchChange?.(event.target.value)} placeholder="Search masters…" disabled={isSaving} />
            <WorkspaceSelect
              value={formData.masterUuid ?? ""}
              onValueChange={(val) => setFormData({ ...formData, masterUuid: val })}
              options={masterOptions}
              disabled={isSaving}
            />
            {errors.masterUuid ? (
              <span className="text-xs text-destructive">{errors.masterUuid}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Schedule Days" required={true}>
            <Input
              value={formData.daysOfWeek}
              onChange={(e) => setFormData({ ...formData, daysOfWeek: e.target.value })}
              placeholder="e.g. Mon, Wed, Fri or Daily"
              disabled={isSaving}
            />
            {errors.daysOfWeek ? (
              <span className="text-xs text-destructive">{errors.daysOfWeek}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Start Time" required={true}>
            <Input
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              placeholder="e.g. 06:00 AM"
              disabled={isSaving}
            />
            {errors.startTime ? (
              <span className="text-xs text-destructive">{errors.startTime}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="End Time" required={true}>
            <Input
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              placeholder="e.g. 07:30 AM"
              disabled={isSaving}
            />
            {errors.endTime ? (
              <span className="text-xs text-destructive">{errors.endTime}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Venue / Training Ground" required={true}>
            <Input
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g. Main Ground (களரி அரங்கம்)"
              disabled={isSaving}
            />
            {errors.venue ? <span className="text-xs text-destructive">{errors.venue}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Maximum Capacity" required={true}>
            <Input
              type="number"
              value={formData.maxCapacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxCapacity: Number(e.target.value) || 0
                })
              }
              placeholder="e.g. 30"
              disabled={isSaving}
            />
            {errors.maxCapacity ? (
              <span className="text-xs text-destructive">{errors.maxCapacity}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Status" required={true}>
            <WorkspaceSelect
              value={formData.status ?? "active"}
              onValueChange={(val) => setFormData({ ...formData, status: val as SessionStatus })}
              options={[
                { label: "Active", value: "active" },
                { label: "Cancelled", value: "cancelled" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>
      </WorkspaceFormSurface>

      <WorkspaceFormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
