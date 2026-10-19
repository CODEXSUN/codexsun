"use client";

import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormSurface,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { memberSchema } from "./member.schema";
import type { MemberRecord, MemberRole, MemberSavePayload, MemberStatus } from "./member.types";

export const memberFormId = "sportsclub-member-form";

const defaultPayload: MemberSavePayload = {
  email: "",
  name: "",
  phone: "",
  dateOfBirth: "",
  gender: "male",
  guardianName: "",
  guardianPhone: "",
  emergencyContact: "",
  medicalNotes: "",
  address: "",
  programUuid: null,
  masterUuid: null,
  role: "student",
  status: "pending",
  progressNote: "",
  revision: 0
};

export function MemberForm({
  initialRecord,
  programOptions = [],
  masterOptions = [],
  programSearch = "",
  onProgramSearchChange,
  masterSearch = "",
  onMasterSearchChange,
  isSaving,
  error,
  onSubmit,
  onBack
}: {
  initialRecord?: MemberRecord | null;
  programOptions?: Array<{ label: string; value: string }>;
  masterOptions?: Array<{ label: string; value: string }>;
  programSearch?: string;
  onProgramSearchChange?: (value: string) => void;
  masterSearch?: string;
  onMasterSearchChange?: (value: string) => void;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (payload: MemberSavePayload) => void;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<MemberSavePayload>(() =>
    initialRecord
      ? {
          email: initialRecord.email,
          name: initialRecord.name,
          phone: initialRecord.phone ?? "",
          dateOfBirth: initialRecord.dateOfBirth ?? "",
          gender: initialRecord.gender ?? "male",
          guardianName: initialRecord.guardianName ?? "",
          guardianPhone: initialRecord.guardianPhone ?? "",
          emergencyContact: initialRecord.emergencyContact ?? "",
          medicalNotes: initialRecord.medicalNotes ?? "",
          address: initialRecord.address ?? "",
          programUuid: initialRecord.programUuid ?? null,
          masterUuid: initialRecord.masterUuid ?? null,
          role: initialRecord.role ?? "student",
          status: initialRecord.status ?? "pending",
          progressNote: initialRecord.progressNote ?? "",
          revision: initialRecord.revision ?? 0
        }
      : defaultPayload
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        email: initialRecord.email,
        name: initialRecord.name,
        phone: initialRecord.phone ?? "",
        dateOfBirth: initialRecord.dateOfBirth ?? "",
        gender: initialRecord.gender ?? "male",
        guardianName: initialRecord.guardianName ?? "",
        guardianPhone: initialRecord.guardianPhone ?? "",
        emergencyContact: initialRecord.emergencyContact ?? "",
        medicalNotes: initialRecord.medicalNotes ?? "",
        address: initialRecord.address ?? "",
        programUuid: initialRecord.programUuid ?? null,
        masterUuid: initialRecord.masterUuid ?? null,
        role: initialRecord.role ?? "student",
        status: initialRecord.status ?? "pending",
        progressNote: initialRecord.progressNote ?? "",
        revision: initialRecord.revision ?? 0
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = memberSchema.safeParse(formData);
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
    onSubmit(result.data as MemberSavePayload);
  };

  const formErrorMessage =
    error ||
    (Object.keys(errors).length > 0
      ? "Please correct the highlighted fields before saving."
      : null);

  return (
    <WorkspaceUpsertPage
      className="max-w-4xl"
      title={
        initialRecord
          ? `Edit Member: ${initialRecord.name}`
          : "New Student Enrollment / மாணவர் சேர்க்கை"
      }
      description="Record student personal details, assigned instructor, enrolled curriculum, emergency contacts, and training progress."
      onBack={onBack}
    >
      {/* Platform Header Save Action Binding */}

      <form id={memberFormId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <WorkspaceFormSurface>
          <WorkspaceFormBody>
            {formErrorMessage ? (
              <WorkspaceFormBanner title="Unable to save member details">
                {formErrorMessage}
              </WorkspaceFormBanner>
            ) : null}

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <WorkspaceFormField label="Full Name / மாணவர் பெயர்" required={true}>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. சிவ. வீரபாண்டியன்"
                  disabled={isSaving}
                />
                {errors.name ? (
                  <span className="text-xs text-destructive">{errors.name}</span>
                ) : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Official Email / மின்னஞ்சல்" required={true}>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  disabled={isSaving}
                />
                {errors.email ? (
                  <span className="text-xs text-destructive">{errors.email}</span>
                ) : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Contact Phone">
                <Input
                  type="tel"
                  value={formData.phone ?? ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  disabled={isSaving}
                />
                {errors.phone ? (
                  <span className="text-xs text-destructive">{errors.phone}</span>
                ) : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Gender">
                <WorkspaceSelect
                  value={formData.gender ?? "male"}
                  onValueChange={(val) => setFormData({ ...formData, gender: val })}
                  options={[
                    { label: "Male / ஆண்", value: "male" },
                    { label: "Female / பெண்", value: "female" },
                    { label: "Other / மற்றவை", value: "other" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Date of Birth">
                <Input
                  type="date"
                  value={formData.dateOfBirth ?? ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value || null })}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Membership Role" required={true}>
                <WorkspaceSelect
                  value={formData.role ?? "student"}
                  onValueChange={(val) => setFormData({ ...formData, role: val as MemberRole })}
                  options={[
                    { label: "Student / மாணவர்", value: "student" },
                    { label: "Master / ஆசான்", value: "master" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Status" required={true}>
                <WorkspaceSelect
                  value={formData.status ?? "pending"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val as MemberStatus })
                  }
                  options={[
                    { label: "Pending Approval / காத்திருப்பு", value: "pending" },
                    { label: "Active / தீவிர பயில்வு", value: "active" },
                    { label: "Suspended / இடைநிறுத்தம்", value: "suspended" },
                    { label: "Graduated / தேர்ச்சி பெற்றவர்", value: "graduated" }
                  ]}
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Enrolled Curriculum / Program">
                <Input aria-label="Search curriculum programs" value={programSearch} onChange={(event) => onProgramSearchChange?.(event.target.value)} placeholder="Search programs…" disabled={isSaving} />
                <WorkspaceSelect
                  value={formData.programUuid ?? "none"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, programUuid: val === "none" ? null : val })
                  }
                  options={[{ label: "None / Not Selected", value: "none" }, ...programOptions]}
                  disabled={isSaving}
                />
                {errors.programUuid ? (
                  <span className="text-xs text-destructive">{errors.programUuid}</span>
                ) : null}
              </WorkspaceFormField>

              <WorkspaceFormField label="Assigned Master / ஆசான்">
                <Input aria-label="Search masters" value={masterSearch} onChange={(event) => onMasterSearchChange?.(event.target.value)} placeholder="Search masters…" disabled={isSaving} />
                <WorkspaceSelect
                  value={formData.masterUuid ?? "none"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, masterUuid: val === "none" ? null : val })
                  }
                  options={[{ label: "None / Unassigned", value: "none" }, ...masterOptions]}
                  disabled={isSaving}
                />
                {errors.masterUuid ? (
                  <span className="text-xs text-destructive">{errors.masterUuid}</span>
                ) : null}
              </WorkspaceFormField>
            </div>

            {/* Guardian & Safety Information */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-foreground">
                Guardian & Emergency Safety (Protected)
              </h3>
              <p className="text-xs text-muted-foreground">
                Guardian phone is required for minors and urgent club medical alerts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <WorkspaceFormField label="Parent / Guardian Name">
                <Input
                  value={formData.guardianName ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianName: e.target.value || null })
                  }
                  placeholder="e.g. S. Arumugam"
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Guardian Phone">
                <Input
                  type="tel"
                  value={formData.guardianPhone ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianPhone: e.target.value || null })
                  }
                  placeholder="10-digit mobile"
                  disabled={isSaving}
                />
              </WorkspaceFormField>

              <WorkspaceFormField label="Emergency Contact">
                <Input
                  type="tel"
                  value={formData.emergencyContact ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContact: e.target.value || null })
                  }
                  placeholder="Alternative contact"
                  disabled={isSaving}
                />
              </WorkspaceFormField>
            </div>

            <WorkspaceFormField label="Residential Address">
              <Input
                value={formData.address ?? ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Door no, Street, Village/Town, Tenkasi"
                disabled={isSaving}
              />
            </WorkspaceFormField>

            <WorkspaceFormField label="Medical & Health Notes">
              <Textarea
                value={formData.medicalNotes ?? ""}
                onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                placeholder="Allergies, chronic conditions, bone injuries, dietary or physical restrictions..."
                disabled={isSaving}
                rows={2}
              />
            </WorkspaceFormField>

            <WorkspaceFormField label="Belt Rank & Syllabus Progress Note">
              <Textarea
                value={formData.progressNote ?? ""}
                onChange={(e) => setFormData({ ...formData, progressNote: e.target.value })}
                placeholder="Current syllabus progress, belt level evaluation, sparring notes..."
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
