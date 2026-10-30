"use client";

import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Switch } from "@codexsun/ui/components/switch";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormSurface,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { programSchema } from "./program.schema";
import type { ProgramLevel, ProgramRecord, ProgramSavePayload, ProgramStatus } from "./program.types";

export const programFormId = "sportsclub-program-form";

const defaultPayload: ProgramSavePayload = {
  code: "",
  name: "",
  discipline: "Silambam / சிலம்பக் கலை",
  description: "",
  level: "beginner",
  ageGroup: "All Ages / அனைத்து வயதினரும்",
  isApprovedPublic: true,
  status: "active",
  sortOrder: 0,
  revision: 0
};

export function ProgramForm({
  initialRecord,
  isSaving,
  error,
  onSubmit,
  onBack
}: {
  initialRecord?: ProgramRecord | null;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (payload: ProgramSavePayload) => void;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<ProgramSavePayload>(() =>
    initialRecord
      ? {
          code: initialRecord.code,
          name: initialRecord.name,
          discipline: initialRecord.discipline,
          description: initialRecord.description,
          level: initialRecord.level,
          ageGroup: initialRecord.ageGroup,
          isApprovedPublic: initialRecord.isApprovedPublic,
          status: initialRecord.status,
          sortOrder: initialRecord.sortOrder,
          revision: initialRecord.revision
        }
      : defaultPayload
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        code: initialRecord.code,
        name: initialRecord.name,
        discipline: initialRecord.discipline,
        description: initialRecord.description,
        level: initialRecord.level,
        ageGroup: initialRecord.ageGroup,
        isApprovedPublic: initialRecord.isApprovedPublic,
        status: initialRecord.status,
        sortOrder: initialRecord.sortOrder,
        revision: initialRecord.revision
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = programSchema.safeParse(formData);
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

  const formErrorMessage =
    error ||
    (Object.keys(errors).length > 0
      ? "Please correct the highlighted fields before saving."
      : null);

  return (
    <WorkspaceUpsertPage
      className="max-w-4xl"
      title={initialRecord ? `Edit Curriculum: ${initialRecord.name}` : "New Training Curriculum"}
      description="Define martial arts syllabus, discipline category, age group, and public catalogue approval."
      onBack={onBack}
    >
      {/* Platform Header Save Action Binding */}

      <form id={programFormId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <WorkspaceFormSurface>
          <WorkspaceFormBody>
            {formErrorMessage ? (
              <WorkspaceFormBanner title="Unable to save program">
                {formErrorMessage}
              </WorkspaceFormBanner>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <WorkspaceFormField label="Curriculum / Program Name" required={true}>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Silambam Basics (அடிப்படை சிலம்பம்)"
                  disabled={isSaving}
                />
                {errors.name ? <span className="text-xs text-destructive">{errors.name}</span> : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Course Code" required={true}>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. SIL-01"
                  disabled={isSaving}
                />
                {errors.code ? <span className="text-xs text-destructive">{errors.code}</span> : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Discipline Category" required={true}>
                <WorkspaceSelect
                  value={formData.discipline}
                  onValueChange={(val) => setFormData({ ...formData, discipline: val })}
                  options={[
                    { label: "Silambam / சிலம்பக் கலை", value: "Silambam / சிலம்பக் கலை" },
                    { label: "Varma Kalai / வர்மக்கலை", value: "Varma Kalai / வர்மக்கலை" },
                    { label: "Traditional Weaponry / சுருள்வாள்", value: "Traditional Weaponry / சுருள்வாள்" },
                    { label: "Athletic Fitness / உடற்தகுதி", value: "Athletic Fitness / உடற்தகுதி" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Target Skill Level" required={true}>
                <WorkspaceSelect
                  value={formData.level}
                  onValueChange={(val) => setFormData({ ...formData, level: val as ProgramLevel })}
                  options={[
                    { label: "Beginner / தொடக்கநிலை", value: "beginner" },
                    { label: "Intermediate / இடைநிலை", value: "intermediate" },
                    { label: "Advanced / உயர்நிலை", value: "advanced" },
                    { label: "All Levels / அனைத்து நிலைகளும்", value: "all_levels" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Age Group" required={true}>
                <Input
                  value={formData.ageGroup}
                  onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                  placeholder="e.g. Juniors (6-14 yrs) or All Ages"
                  disabled={isSaving}
                />
                {errors.ageGroup ? (
                  <span className="text-xs text-destructive">{errors.ageGroup}</span>
                ) : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Status" required={true}>
                <WorkspaceSelect
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as ProgramStatus })}
                  options={[
                    { label: "Active / பயன்பாட்டில்", value: "active" },
                    { label: "Inactive / இடைநிறுத்தம்", value: "inactive" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Display Sort Order">
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })
                  }
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-foreground">
                    Public Catalogue Showcase
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Showcase program on public Tenkasi Sports marketing pages
                  </p>
                </div>
                <Switch
                  checked={formData.isApprovedPublic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isApprovedPublic: checked })
                  }
                  disabled={isSaving}
                />
              </div>
            </div>

            <WorkspaceFormField label="Curriculum Description">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed training syllabus, weapon techniques, and examination criteria..."
                disabled={isSaving}
                rows={4}
              />
            </WorkspaceFormField>
          </WorkspaceFormBody>

          <WorkspaceFormActions>
            <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
              Cancel
            </Button>
          </WorkspaceFormActions>
        </WorkspaceFormSurface>
      </form>
    </WorkspaceUpsertPage>
  );
}
