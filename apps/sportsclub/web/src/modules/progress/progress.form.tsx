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
import { progressSchema } from "./progress.schema";
import type { ProgressRecord, ProgressSavePayload, ProgressStatus } from "./progress.types";

const todayString = () => new Date().toISOString().split("T")[0]!;

export function ProgressForm({
  initialRecord,
  studentOptions = [],
  masterOptions = [],
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: ProgressRecord | null;
  studentOptions?: Array<{ label: string; value: string }>;
  masterOptions?: Array<{ label: string; value: string }>;
  isSaving: boolean;
  onSubmit: (payload: ProgressSavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ProgressSavePayload>(() =>
    initialRecord
      ? {
          memberUuid: initialRecord.memberUuid,
          masterUuid: initialRecord.masterUuid,
          stageLevel: initialRecord.stageLevel,
          assessmentDate: initialRecord.assessmentDate,
          status: initialRecord.status,
          certificateNo: initialRecord.certificateNo ?? "",
          evaluationNotes: initialRecord.evaluationNotes ?? ""
        }
      : {
          memberUuid: studentOptions[0]?.value ?? "",
          masterUuid: masterOptions[0]?.value ?? "",
          stageLevel: "Level 1 - Basic Stances (சமநிலை & ஆயத்த நிலை)",
          assessmentDate: todayString(),
          status: "in_progress",
          certificateNo: "",
          evaluationNotes: ""
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        memberUuid: initialRecord.memberUuid,
        masterUuid: initialRecord.masterUuid,
        stageLevel: initialRecord.stageLevel,
        assessmentDate: initialRecord.assessmentDate,
        status: initialRecord.status,
        certificateNo: initialRecord.certificateNo ?? "",
        evaluationNotes: initialRecord.evaluationNotes ?? ""
      });
    } else if (studentOptions.length > 0 || masterOptions.length > 0) {
      setFormData((prev) => ({
        ...prev,
        memberUuid: prev.memberUuid || (studentOptions[0]?.value ?? ""),
        masterUuid: prev.masterUuid || (masterOptions[0]?.value ?? "")
      }));
    }
  }, [initialRecord, studentOptions, masterOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = progressSchema.safeParse(formData);
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

          <WorkspaceFormField label="Evaluating Master / ஆசான்" required={true}>
            <WorkspaceSelect
              value={formData.masterUuid}
              onValueChange={(val) => setFormData({ ...formData, masterUuid: val })}
              options={masterOptions}
              disabled={isSaving}
            />
            {errors.masterUuid ? (
              <span className="text-xs text-destructive">{errors.masterUuid}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Target Level / Belt" required={true}>
            <WorkspaceSelect
              value={formData.stageLevel}
              onValueChange={(val) => setFormData({ ...formData, stageLevel: val })}
              options={[
                { label: "Level 1 - Basic Stances (சமநிலை & ஆயத்த நிலை)", value: "Level 1 - Basic Stances (சமநிலை & ஆயத்த நிலை)" },
                { label: "Level 2 - Single Stick (ஒற்றைச் சிலம்பு சுழற்சி)", value: "Level 2 - Single Stick (ஒற்றைச் சிலம்பு சுழற்சி)" },
                { label: "Level 3 - Double Stick (இரட்டைச் சிலம்பு வீச்சு)", value: "Level 3 - Double Stick (இரட்டைச் சிலம்பு வீச்சு)" },
                { label: "Level 4 - Traditional Weaponry (சுருள்வாள் / வேல்கம்பு)", value: "Level 4 - Traditional Weaponry (சுருள்வாள் / வேல்கம்பு)" },
                { label: "Level 5 - Varma Kalai Defense (வர்மக்கலை தற்காப்பு)", value: "Level 5 - Varma Kalai Defense (வர்மக்கலை தற்காப்பு)" },
                { label: "Level 6 - Gurukulam Master Rank (ஆசான் பட்டம்)", value: "Level 6 - Gurukulam Master Rank (ஆசான் பட்டம்)" }
              ]}
              disabled={isSaving}
            />
            {errors.stageLevel ? (
              <span className="text-xs text-destructive">{errors.stageLevel}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Assessment Date" required={true}>
            <Input
              type="date"
              value={formData.assessmentDate}
              onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
              disabled={isSaving}
            />
            {errors.assessmentDate ? (
              <span className="text-xs text-destructive">{errors.assessmentDate}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Grading Result" required={true}>
            <WorkspaceSelect
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val as ProgressStatus })}
              options={[
                { label: "Passed / தகுதி பெற்றார்", value: "passed" },
                { label: "In Progress / தேர்வில் உள்ளார்", value: "in_progress" },
                { label: "Eligible for Exam / தேர்வு தகுதி", value: "eligible" },
                { label: "Retry Needed / மறுபயிற்சி தேவை", value: "retry" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Certificate / Order No">
            <Input
              value={formData.certificateNo ?? ""}
              onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value || null })}
              placeholder="e.g. VTSG-2026-042"
              disabled={isSaving}
            />
            {errors.certificateNo ? (
              <span className="text-xs text-destructive">{errors.certificateNo}</span>
            ) : null}
          </WorkspaceFormField>
        </div>

        <WorkspaceFormField label="Master Evaluation Notes & Technical Feedback">
          <Textarea
            value={formData.evaluationNotes ?? ""}
            onChange={(e) => setFormData({ ...formData, evaluationNotes: e.target.value || null })}
            placeholder="Feedback on footwork, stance stability, stick rotation rhythm, and martial ethics..."
            disabled={isSaving}
            rows={3}
          />
          {errors.evaluationNotes ? (
            <span className="text-xs text-destructive">{errors.evaluationNotes}</span>
          ) : null}
        </WorkspaceFormField>
      </WorkspaceFormSurface>

      <WorkspaceFormActions>
        <Button type="submit" disabled={isSaving}>
          {initialRecord ? "Save Assessment" : "Record Assessment"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
