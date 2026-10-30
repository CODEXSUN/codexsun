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
import { masterSchema } from "./master.schema";
import type { MasterRecord, MasterSavePayload, MasterStatus } from "./master.types";

export const masterFormId = "sportsclub-master-form";

const defaultPayload: MasterSavePayload = {
  email: "",
  name: "",
  phone: "",
  title: "Silambam Asan / ஆசிரியர்",
  primaryDiscipline: "Silambam / சிலம்பக் கலை",
  publicBio: "",
  privateNotes: "",
  experienceYears: 5,
  isApprovedPublic: true,
  status: "active",
  sortOrder: 0,
  revision: 0
};

export function MasterForm({
  initialRecord,
  isSaving,
  error,
  onSubmit,
  onBack
}: {
  initialRecord?: MasterRecord | null;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (payload: MasterSavePayload) => void;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<MasterSavePayload>(() =>
    initialRecord
      ? {
          email: initialRecord.email,
          name: initialRecord.name,
          phone: initialRecord.phone,
          title: initialRecord.title,
          primaryDiscipline: initialRecord.primaryDiscipline,
          publicBio: initialRecord.publicBio,
          privateNotes: initialRecord.privateNotes,
          experienceYears: initialRecord.experienceYears,
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
        email: initialRecord.email,
        name: initialRecord.name,
        phone: initialRecord.phone,
        title: initialRecord.title,
        primaryDiscipline: initialRecord.primaryDiscipline,
        publicBio: initialRecord.publicBio,
        privateNotes: initialRecord.privateNotes,
        experienceYears: initialRecord.experienceYears,
        isApprovedPublic: initialRecord.isApprovedPublic,
        status: initialRecord.status,
        sortOrder: initialRecord.sortOrder,
        revision: initialRecord.revision
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const formErrorMessage =
    error ||
    (Object.keys(errors).length > 0
      ? "Please correct the highlighted fields before saving."
      : null);

  return (
    <WorkspaceUpsertPage
      className="max-w-4xl"
      title={initialRecord ? `Edit Master: ${initialRecord.name}` : "New Asan / Instructor"}
      description="Record coach credentials, martial arts specialization, public profile approval, and contact details."
      onBack={onBack}
    >
      {/* Platform Header Save Action Binding */}

      <form id={masterFormId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <WorkspaceFormSurface>
          <WorkspaceFormBody>
            {formErrorMessage ? (
              <WorkspaceFormBanner title="Unable to save master profile">
                {formErrorMessage}
              </WorkspaceFormBanner>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <WorkspaceFormField label="Instructor Name / ஆசான் பெயர்" required={true}>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ஆசான் தி. வீரபாண்டியன்"
                  disabled={isSaving}
                />
                {errors.name ? <span className="text-xs text-destructive">{errors.name}</span> : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Designation / Title" required={true}>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Head Asan & Founder"
                  disabled={isSaving}
                />
                {errors.title ? <span className="text-xs text-destructive">{errors.title}</span> : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Official Email Address" required={true}>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="asan@tenkasisports.com"
                  disabled={isSaving}
                />
                {errors.email ? <span className="text-xs text-destructive">{errors.email}</span> : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Contact Phone">
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  disabled={isSaving}
                />
                {errors.phone ? <span className="text-xs text-destructive">{errors.phone}</span> : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Primary Discipline" required={true}>
                <WorkspaceSelect
                  value={formData.primaryDiscipline}
                  onValueChange={(val) => setFormData({ ...formData, primaryDiscipline: val })}
                  options={[
                    { label: "Silambam / சிலம்பக் கலை", value: "Silambam / சிலம்பக் கலை" },
                    { label: "Varma Kalai / வர்மக்கலை", value: "Varma Kalai / வர்மக்கலை" },
                    { label: "Traditional Weaponry / சுருள்வாள்", value: "Traditional Weaponry / சுருள்வாள்" },
                    { label: "Silambam & Varmam Combined", value: "Silambam & Varmam Combined" },
                    { label: "Athletic Conditioning", value: "Athletic Conditioning" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Experience (Years)">
                <Input
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    setFormData({ ...formData, experienceYears: parseInt(e.target.value, 10) || 0 })
                  }
                  disabled={isSaving}
                />
                {errors.experienceYears ? (
                  <span className="text-xs text-destructive">{errors.experienceYears}</span>
                ) : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Status" required={true}>
                <WorkspaceSelect
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as MasterStatus })}
                  options={[
                    { label: "Active / பணியில்", value: "active" },
                    { label: "Suspended / இடைநிறுத்தம்", value: "suspended" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-foreground">
                    Public Academy Showcase
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Display instructor bio on public club marketing site
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

            <WorkspaceFormField label="Public Biography">
              <Textarea
                value={formData.publicBio}
                onChange={(e) => setFormData({ ...formData, publicBio: e.target.value })}
                placeholder="Background in traditional Gurukulam Silambam lineage, certifications, and teaching heritage..."
                disabled={isSaving}
                rows={3}
              />
            </WorkspaceFormField>

            <WorkspaceFormField label="Private Admin Notes">
              <Textarea
                value={formData.privateNotes}
                onChange={(e) => setFormData({ ...formData, privateNotes: e.target.value })}
                placeholder="Internal notes, emergency backup contacts, training branch assignments..."
                disabled={isSaving}
                rows={2}
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
