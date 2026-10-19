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
import { masterSchema } from "./master.schema";
import type { MasterRecord, MasterSavePayload, MasterStatus } from "./master.types";

const defaultPayload: MasterSavePayload = {
  fullName: "",
  title: "Asan / ஆசான்",
  biography: "",
  phone: "",
  email: "",
  specialization: "Silambam & Varma Kalai",
  experienceYears: 10,
  isApprovedPublic: true,
  status: "active"
};

export function MasterForm({
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: MasterRecord | null;
  isSaving: boolean;
  onSubmit: (payload: MasterSavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<MasterSavePayload>(() =>
    initialRecord
      ? {
          fullName: initialRecord.fullName,
          title: initialRecord.title,
          biography: initialRecord.biography ?? "",
          phone: initialRecord.phone ?? "",
          email: initialRecord.email ?? "",
          specialization: initialRecord.specialization,
          experienceYears: initialRecord.experienceYears ?? null,
          isApprovedPublic: initialRecord.isApprovedPublic,
          status: initialRecord.status
        }
      : defaultPayload
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        fullName: initialRecord.fullName,
        title: initialRecord.title,
        biography: initialRecord.biography ?? "",
        phone: initialRecord.phone ?? "",
        email: initialRecord.email ?? "",
        specialization: initialRecord.specialization,
        experienceYears: initialRecord.experienceYears ?? null,
        isApprovedPublic: initialRecord.isApprovedPublic,
        status: initialRecord.status
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = masterSchema.safeParse(formData);
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
          <WorkspaceFormField label="Full Name" required={true}>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Asan Thiru. Veerapandian"
              disabled={isSaving}
            />
            {errors.fullName ? (
              <span className="text-xs text-destructive">{errors.fullName}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Title / Designation" required={true}>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Silambam & Varma Asan"
              disabled={isSaving}
            />
            {errors.title ? <span className="text-xs text-destructive">{errors.title}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Specialization" required={true}>
            <Input
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Silambam, Varma Kalai, Traditional Weaponry"
              disabled={isSaving}
            />
            {errors.specialization ? (
              <span className="text-xs text-destructive">{errors.specialization}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Years of Experience">
            <Input
              type="number"
              value={formData.experienceYears ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experienceYears: e.target.value ? Number(e.target.value) : null
                })
              }
              placeholder="e.g. 15"
              disabled={isSaving}
            />
            {errors.experienceYears ? (
              <span className="text-xs text-destructive">{errors.experienceYears}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Contact Phone">
            <Input
              type="tel"
              value={formData.phone ?? ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
              placeholder="10-digit mobile number"
              disabled={isSaving}
            />
            {errors.phone ? <span className="text-xs text-destructive">{errors.phone}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Email Address">
            <Input
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
              placeholder="instructor@example.com"
              disabled={isSaving}
            />
            {errors.email ? <span className="text-xs text-destructive">{errors.email}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Status" required={true}>
            <WorkspaceSelect
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val as MasterStatus })}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive / Suspended", value: "inactive" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <div className="flex flex-col justify-center space-y-1 rounded-md border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Approved for Public Profile</span>
              <Switch
                checked={formData.isApprovedPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isApprovedPublic: checked })
                }
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, biography and specialization appear on the club public portal.
            </p>
          </div>
        </div>

        <WorkspaceFormField label="Biography & Credentials">
          <Textarea
            value={formData.biography ?? ""}
            onChange={(e) => setFormData({ ...formData, biography: e.target.value || null })}
            placeholder="Official background, gurukulam lineage, achievements..."
            disabled={isSaving}
            rows={3}
          />
          {errors.biography ? (
            <span className="text-xs text-destructive">{errors.biography}</span>
          ) : null}
        </WorkspaceFormField>
      </WorkspaceFormSurface>

      <WorkspaceFormActions>
        <Button type="submit" disabled={isSaving}>
          {initialRecord ? "Save Changes" : "Create Master Profile"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
