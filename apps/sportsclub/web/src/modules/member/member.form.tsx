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
import { memberSchema } from "./member.schema";
import type { MemberRecord, MemberSavePayload, MemberStatus } from "./member.types";

const defaultPayload: MemberSavePayload = {
  fullName: "",
  dateOfBirth: "",
  gender: "male",
  bloodGroup: "",
  guardianName: "",
  guardianRelation: "",
  guardianPhone: "",
  emergencyContact: "",
  address: "",
  currentLevel: "Beginner",
  masterUuid: null,
  status: "active"
};

export function MemberForm({
  initialRecord,
  masterOptions = [],
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: MemberRecord | null;
  masterOptions?: Array<{ label: string; value: string }>;
  isSaving: boolean;
  onSubmit: (payload: MemberSavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<MemberSavePayload>(() =>
    initialRecord
      ? {
          fullName: initialRecord.fullName,
          dateOfBirth: initialRecord.dateOfBirth ?? "",
          gender: initialRecord.gender,
          bloodGroup: initialRecord.bloodGroup ?? "",
          guardianName: initialRecord.guardianName ?? "",
          guardianRelation: initialRecord.guardianRelation ?? "",
          guardianPhone: initialRecord.guardianPhone ?? "",
          emergencyContact: initialRecord.emergencyContact ?? "",
          address: initialRecord.address ?? "",
          currentLevel: initialRecord.currentLevel,
          masterUuid: initialRecord.masterUuid ?? null,
          status: initialRecord.status
        }
      : defaultPayload
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        fullName: initialRecord.fullName,
        dateOfBirth: initialRecord.dateOfBirth ?? "",
        gender: initialRecord.gender,
        bloodGroup: initialRecord.bloodGroup ?? "",
        guardianName: initialRecord.guardianName ?? "",
        guardianRelation: initialRecord.guardianRelation ?? "",
        guardianPhone: initialRecord.guardianPhone ?? "",
        emergencyContact: initialRecord.emergencyContact ?? "",
        address: initialRecord.address ?? "",
        currentLevel: initialRecord.currentLevel,
        masterUuid: initialRecord.masterUuid ?? null,
        status: initialRecord.status
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <h3 className="text-sm font-semibold text-foreground">Student Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WorkspaceFormField label="Full Name" required={true}>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. S. Veeran"
              disabled={isSaving}
            />
            {errors.fullName ? (
              <span className="text-xs text-destructive">{errors.fullName}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Gender" required={true}>
            <WorkspaceSelect
              value={formData.gender}
              onValueChange={(val) =>
                setFormData({ ...formData, gender: val as "male" | "female" | "other" })
              }
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" }
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
            {errors.dateOfBirth ? (
              <span className="text-xs text-destructive">{errors.dateOfBirth}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Blood Group">
            <Input
              value={formData.bloodGroup ?? ""}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value || null })}
              placeholder="e.g. O+ve, B+ve"
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Current Belt / Level" required={true}>
            <WorkspaceSelect
              value={formData.currentLevel}
              onValueChange={(val) => setFormData({ ...formData, currentLevel: val })}
              options={[
                { label: "Beginner / ஆரம்ப நிலை", value: "Beginner" },
                { label: "Level 1 - Basic Stances (சமநிலை & ஆயத்த நிலை)", value: "Level 1 - Basic Stances" },
                { label: "Level 2 - Single Stick (ஒற்றைச் சிலம்பு)", value: "Level 2 - Single Stick" },
                { label: "Level 3 - Double Stick (இரட்டைச் சிலம்பு)", value: "Level 3 - Double Stick" },
                { label: "Level 4 - Traditional Weaponry (சுருள்வாள் / வேல்கம்பு)", value: "Level 4 - Traditional Weaponry" },
                { label: "Level 5 - Advanced Varma Kalai (வர்மக்கலை)", value: "Level 5 - Advanced Varma Kalai" },
                { label: "Instructor / ஆசான் நிலை", value: "Instructor" }
              ]}
              disabled={isSaving}
            />
            {errors.currentLevel ? (
              <span className="text-xs text-destructive">{errors.currentLevel}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Assigned Master / ஆசான்">
            <WorkspaceSelect
              value={formData.masterUuid ?? "none"}
              onValueChange={(val) =>
                setFormData({ ...formData, masterUuid: val === "none" ? null : val })
              }
              options={[{ label: "Unassigned", value: "none" }, ...masterOptions]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Status" required={true}>
            <WorkspaceSelect
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val as MemberStatus })}
              options={[
                { label: "Active", value: "active" },
                { label: "Pending Approval", value: "pending" },
                { label: "Suspended", value: "suspended" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>

        <h3 className="pt-2 text-sm font-semibold text-foreground">
          Guardian & Safety Details (Protected)
        </h3>
        <p className="text-xs text-muted-foreground">
          Required for minors and emergency alerts. Guardian contact is strictly confidential.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WorkspaceFormField label="Guardian Name">
            <Input
              value={formData.guardianName ?? ""}
              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value || null })}
              placeholder="e.g. Parent or Guardian Name"
              disabled={isSaving}
            />
            {errors.guardianName ? (
              <span className="text-xs text-destructive">{errors.guardianName}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Relationship to Student">
            <Input
              value={formData.guardianRelation ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, guardianRelation: e.target.value || null })
              }
              placeholder="e.g. Father, Mother, Guardian"
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Guardian Phone (10 digits)">
            <Input
              type="tel"
              value={formData.guardianPhone ?? ""}
              onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value || null })}
              placeholder="10-digit mobile number"
              disabled={isSaving}
            />
            {errors.guardianPhone ? (
              <span className="text-xs text-destructive">{errors.guardianPhone}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Emergency Contact Phone">
            <Input
              type="tel"
              value={formData.emergencyContact ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, emergencyContact: e.target.value || null })
              }
              placeholder="10-digit emergency number"
              disabled={isSaving}
            />
            {errors.emergencyContact ? (
              <span className="text-xs text-destructive">{errors.emergencyContact}</span>
            ) : null}
          </WorkspaceFormField>
        </div>

        <WorkspaceFormField label="Residential Address">
          <Textarea
            value={formData.address ?? ""}
            onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
            placeholder="Street address, City, Pincode"
            disabled={isSaving}
            rows={2}
          />
          {errors.address ? (
            <span className="text-xs text-destructive">{errors.address}</span>
          ) : null}
        </WorkspaceFormField>
      </WorkspaceFormSurface>

      <WorkspaceFormActions>
        <Button type="submit" disabled={isSaving}>
          {initialRecord ? "Save Changes" : "Create Member"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
