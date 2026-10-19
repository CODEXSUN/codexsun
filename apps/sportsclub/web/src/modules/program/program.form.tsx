"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Switch } from "@codexsun/ui/components/switch";
import {
  WorkspaceFormActions,
  WorkspaceFormField,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { programSchema } from "./program.schema";
import type { ProgramRecord, ProgramSavePayload, ProgramStatus } from "./program.types";

const defaultPayload: ProgramSavePayload = {
  title: "Silambam / சிலம்பக் கலை",
  slug: "silambam",
  description:
    "Traditional martial art of Tamil Nadu focusing on footwork, stances, single/double stick rotations, and defensive techniques.",
  category: "silambam",
  skillLevels: "6 Graduated Levels (Beginner to Instructor)",
  isApprovedPublic: true,
  status: "active"
};

export function ProgramForm({
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: ProgramRecord | null;
  isSaving: boolean;
  onSubmit: (payload: ProgramSavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ProgramSavePayload>(() =>
    initialRecord
      ? {
          title: initialRecord.title,
          slug: initialRecord.slug,
          description: initialRecord.description,
          category: initialRecord.category,
          skillLevels: initialRecord.skillLevels,
          isApprovedPublic: initialRecord.isApprovedPublic,
          status: initialRecord.status
        }
      : defaultPayload
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        title: initialRecord.title,
        slug: initialRecord.slug,
        description: initialRecord.description,
        category: initialRecord.category,
        skillLevels: initialRecord.skillLevels,
        isApprovedPublic: initialRecord.isApprovedPublic,
        status: initialRecord.status
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <WorkspaceFormField label="Discipline Title" required={true}>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Silambam / சிலம்பக் கலை"
              disabled={isSaving}
            />
            {errors.title ? <span className="text-xs text-destructive">{errors.title}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="URL Slug" required={true}>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              placeholder="e.g. silambam"
              disabled={isSaving}
            />
            {errors.slug ? <span className="text-xs text-destructive">{errors.slug}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Category" required={true}>
            <WorkspaceSelect
              value={formData.category}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  category: val as "silambam" | "varma" | "traditional" | "fitness"
                })
              }
              options={[
                { label: "Silambam / சிலம்பம்", value: "silambam" },
                { label: "Varma Kalai / வர்மக்கலை", value: "varma" },
                { label: "Traditional Weaponry / சுருள்வாள்", value: "traditional" },
                { label: "Athletics & Fitness / உடற்தகுதி", value: "fitness" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Grading Levels / Belts" required={true}>
            <Input
              value={formData.skillLevels}
              onChange={(e) => setFormData({ ...formData, skillLevels: e.target.value })}
              placeholder="e.g. Beginner, Intermediate, Advanced, Master"
              disabled={isSaving}
            />
            {errors.skillLevels ? (
              <span className="text-xs text-destructive">{errors.skillLevels}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Status" required={true}>
            <WorkspaceSelect
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val as ProgramStatus })}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <div className="flex flex-col justify-center space-y-1 rounded-md border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Approved for Public Discovery</span>
              <Switch
                checked={formData.isApprovedPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isApprovedPublic: checked })
                }
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Expose this martial arts program on the tenkasisports public site and admission forms.
            </p>
          </div>
        </div>

        <WorkspaceFormField label="Curriculum Description & Syllabus" required={true}>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Discipline history, syllabus highlights, stances, and training requirements..."
            disabled={isSaving}
            rows={3}
          />
          {errors.description ? (
            <span className="text-xs text-destructive">{errors.description}</span>
          ) : null}
        </WorkspaceFormField>
      </WorkspaceFormSurface>

      <WorkspaceFormActions>
        <Button type="submit" disabled={isSaving}>
          {initialRecord ? "Save Changes" : "Create Discipline"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
