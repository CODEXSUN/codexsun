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
import { enquirySchema } from "./enquiry.schema";
import type { EnquiryRecord, EnquirySavePayload, EnquiryStatus } from "./enquiry.types";

const defaultPayload: EnquirySavePayload = {
  name: "",
  phone: "",
  email: null,
  programOfInterest: "Silambam / சிலம்பக் கலை",
  preferredTiming: "Morning (06:00 AM - 07:30 AM)",
  message: "",
  status: "new",
  adminNotes: null
};

export function EnquiryForm({
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: EnquiryRecord | null;
  isSaving: boolean;
  onSubmit: (payload: EnquirySavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<EnquirySavePayload>(() =>
    initialRecord
      ? {
          name: initialRecord.name,
          phone: initialRecord.phone,
          email: initialRecord.email ?? null,
          programOfInterest: initialRecord.programOfInterest ?? "Silambam / சிலம்பக் கலை",
          preferredTiming: initialRecord.preferredTiming ?? "Morning (06:00 AM - 07:30 AM)",
          message: initialRecord.message,
          status: initialRecord.status,
          adminNotes: initialRecord.adminNotes ?? null
        }
      : defaultPayload
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setFormData({
        name: initialRecord.name,
        phone: initialRecord.phone,
        email: initialRecord.email ?? null,
        programOfInterest: initialRecord.programOfInterest ?? "Silambam / சிலம்பக் கலை",
        preferredTiming: initialRecord.preferredTiming ?? "Morning (06:00 AM - 07:30 AM)",
        message: initialRecord.message,
        status: initialRecord.status,
        adminNotes: initialRecord.adminNotes ?? null
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = enquirySchema.safeParse(formData);
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
          <WorkspaceFormField label="Visitor Name" required={true}>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Applicant or Parent Name"
              disabled={isSaving}
            />
            {errors.name ? <span className="text-xs text-destructive">{errors.name}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Contact Phone (10 digits)" required={true}>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              placeholder="visitor@example.com"
              disabled={isSaving}
            />
            {errors.email ? <span className="text-xs text-destructive">{errors.email}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Discipline of Interest">
            <WorkspaceSelect
              value={formData.programOfInterest ?? "Silambam / சிலம்பக் கலை"}
              onValueChange={(val) => setFormData({ ...formData, programOfInterest: val })}
              options={[
                { label: "Silambam / சிலம்பக் கலை", value: "Silambam / சிலம்பக் கலை" },
                { label: "Varma Kalai / வர்மக்கலை", value: "Varma Kalai / வர்மக்கலை" },
                { label: "Traditional Weaponry / சுருள்வாள்", value: "Traditional Weaponry / சுருள்வாள்" },
                { label: "Athletic Fitness / உடற்தகுதி", value: "Athletic Fitness / உடற்தகுதி" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Preferred Timing">
            <WorkspaceSelect
              value={formData.preferredTiming ?? "Morning (06:00 AM - 07:30 AM)"}
              onValueChange={(val) => setFormData({ ...formData, preferredTiming: val })}
              options={[
                { label: "Morning (06:00 AM - 07:30 AM)", value: "Morning (06:00 AM - 07:30 AM)" },
                { label: "Evening (05:00 PM - 06:30 PM)", value: "Evening (05:00 PM - 06:30 PM)" },
                { label: "Weekend Intensive", value: "Weekend Intensive" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Enquiry Status" required={true}>
            <WorkspaceSelect
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val as EnquiryStatus })}
              options={[
                { label: "New Lead / புதியது", value: "new" },
                { label: "Contacted / தொடர்பு கொள்ளப்பட்டது", value: "contacted" },
                { label: "Enrolled / சேர்க்கப்பட்டார்", value: "enrolled" },
                { label: "Closed / முடிந்தது", value: "closed" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>

        <WorkspaceFormField label="Message / Question" required={true}>
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Details on student age, prior experience, or admission question..."
            disabled={isSaving}
            rows={3}
          />
          {errors.message ? <span className="text-xs text-destructive">{errors.message}</span> : null}
        </WorkspaceFormField>

        <WorkspaceFormField label="Admin Follow-up Notes">
          <Textarea
            value={formData.adminNotes ?? ""}
            onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value || null })}
            placeholder="Internal notes from call or trial class invitation..."
            disabled={isSaving}
            rows={2}
          />
          {errors.adminNotes ? <span className="text-xs text-destructive">{errors.adminNotes}</span> : null}
        </WorkspaceFormField>
      </WorkspaceFormSurface>

      <WorkspaceFormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : initialRecord ? "Save Enquiry" : "Record Enquiry"}
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
