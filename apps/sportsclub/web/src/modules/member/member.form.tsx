"use client";

import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs";
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
import { MemberPhotoField, validateMemberPhoto } from "./member.photo";
import type { MemberRecord, MemberSavePayload, MemberStatus } from "./member.types";

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
  initialPhoto,
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
  initialPhoto?: File | null;
  programOptions?: Array<{ label: string; value: string }>;
  masterOptions?: Array<{ label: string; value: string }>;
  programSearch?: string;
  onProgramSearchChange?: (value: string) => void;
  masterSearch?: string;
  onMasterSearchChange?: (value: string) => void;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (payload: MemberSavePayload, photo: File | null) => void;
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
  const [activeTab, setActiveTab] = useState("personal");
  const [photo, setPhoto] = useState<File | null>(initialPhoto ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);

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
    if (photoError) {
      setActiveTab("personal");
      return;
    }
    const selectedPhotoError = photo ? validateMemberPhoto(photo) : null;
    setPhotoError(selectedPhotoError);
    if (selectedPhotoError) {
      setActiveTab("personal");
      return;
    }
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
      const firstField = result.error.issues[0]?.path[0];
      if (["programUuid", "masterUuid", "progressNote"].includes(String(firstField)))
        setActiveTab("training");
      else if (
        ["guardianName", "guardianPhone", "emergencyContact", "address", "medicalNotes"].includes(
          String(firstField)
        )
      )
        setActiveTab("safety");
      else if (["role", "status"].includes(String(firstField))) setActiveTab("verification");
      else setActiveTab("personal");
      return;
    }
    setErrors({});
    onSubmit(result.data as MemberSavePayload, formData.role === "student" ? photo : null);
  };

  const formErrorMessage =
    error ||
    (Object.keys(errors).length > 0
      ? "Please correct the highlighted fields before saving."
      : null);

  return (
    <WorkspaceUpsertPage className="max-w-4xl" title="" onBack={onBack}>
      {/* Platform Header Save Action Binding */}

      <form id={memberFormId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <WorkspaceFormSurface>
          <WorkspaceFormBody>
            {formErrorMessage ? (
              <WorkspaceFormBanner title="Unable to save member details">
                {formErrorMessage}
              </WorkspaceFormBanner>
            ) : null}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList
                aria-label="Student form sections"
                variant="line"
                className="flex w-full justify-start gap-1 overflow-x-auto"
              >
                <TabsTrigger value="personal">
                  {formData.role === "student" ? "Personal & Photo" : "Personal"}
                </TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="safety">Guardian & Safety</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>
              <TabsContent
                value="personal"
                className="space-y-5 pt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
              >
                {formData.role === "student" ? (
                  <MemberPhotoField
                    memberUuid={initialRecord?.uuid}
                    file={photo}
                    onFileChange={setPhoto}
                    disabled={isSaving}
                    error={photoError}
                    onError={setPhotoError}
                  />
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
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value || null })
                      }
                      disabled={isSaving}
                    />
                  </WorkspaceFormField>
                </div>
              </TabsContent>
              <TabsContent
                value="verification"
                className="space-y-5 pt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
              >
                <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                  <p className="font-semibold">Enrollment review</p>
                  <p className="mt-1 text-muted-foreground">
                    Confirm this member’s role and enrollment status before saving.
                  </p>
                  <p className="mt-3 text-foreground">
                    {formData.name || "Unnamed member"} · {formData.email || "No email entered"}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <WorkspaceFormField label="Membership Role" required={true}>
                    <Input
                      value={formData.role === "student" ? "Student / மாணவர்" : "Master / ஆசான்"}
                      readOnly
                      aria-label="Membership role"
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
                </div>
              </TabsContent>
              <TabsContent
                value="training"
                className="space-y-5 pt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <WorkspaceFormField label="Enrolled Curriculum / Program">
                    <Input
                      aria-label="Search curriculum programs"
                      value={programSearch}
                      onChange={(event) => onProgramSearchChange?.(event.target.value)}
                      placeholder="Search programs…"
                      disabled={isSaving}
                    />
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
                    <Input
                      aria-label="Search masters"
                      value={masterSearch}
                      onChange={(event) => onMasterSearchChange?.(event.target.value)}
                      placeholder="Search masters…"
                      disabled={isSaving}
                    />
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
                <WorkspaceFormField label="Belt Rank & Syllabus Progress Note">
                  <Textarea
                    value={formData.progressNote ?? ""}
                    onChange={(e) => setFormData({ ...formData, progressNote: e.target.value })}
                    placeholder="Current syllabus progress, belt level evaluation, sparring notes..."
                    disabled={isSaving}
                    rows={3}
                  />
                </WorkspaceFormField>
              </TabsContent>
              <TabsContent
                value="safety"
                className="space-y-5 pt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
              >
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
              </TabsContent>
            </Tabs>
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
