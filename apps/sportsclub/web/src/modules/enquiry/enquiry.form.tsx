"use client";
import { useState } from "react";
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
import { enquirySchema } from "./enquiry.schema";
import type { EnquiryRecord, EnquirySavePayload, EnquiryStatus } from "./enquiry.types";
export function EnquiryForm({
  formId,
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  formId?: string;
  initialRecord?: EnquiryRecord | null;
  isSaving: boolean;
  onSubmit: (payload: EnquirySavePayload) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<EnquirySavePayload>({
    name: initialRecord?.name ?? "",
    email: initialRecord?.email ?? "",
    phone: initialRecord?.phone ?? "",
    interest: initialRecord?.interest ?? "",
    message: initialRecord?.message ?? "",
    consent: initialRecord?.consent ?? false,
    status: initialRecord?.status ?? "new",
    notes: initialRecord?.notes ?? "",
    revision: initialRecord?.revision ?? 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = enquirySchema.safeParse(value);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }
  return (
    <form id={formId} onSubmit={submit} className="space-y-4">
      <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
      {Object.keys(errors).length ? (
        <p role="alert" className="text-sm text-destructive">
          Correct the highlighted fields.
        </p>
      ) : null}
      <WorkspaceFormSurface className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <WorkspaceFormField label="Name" required>
            <Input
              value={value.name}
              onChange={(event) =>
                setValue((current) => ({ ...current, name: event.target.value }))
              }
              disabled={isSaving}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Email" required>
            <Input
              type="email"
              value={value.email}
              onChange={(event) =>
                setValue((current) => ({ ...current, email: event.target.value }))
              }
              disabled={isSaving}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Phone">
            <Input
              value={value.phone}
              onChange={(event) =>
                setValue((current) => ({ ...current, phone: event.target.value }))
              }
              disabled={isSaving}
            />
          </WorkspaceFormField>
          <WorkspaceFormField label="Interest">
            <Input
              value={value.interest}
              onChange={(event) =>
                setValue((current) => ({ ...current, interest: event.target.value }))
              }
              disabled={isSaving}
            />
          </WorkspaceFormField>
          <WorkspaceFormField label="Status" required>
            <WorkspaceSelect
              value={value.status}
              onValueChange={(status) =>
                setValue((current) => ({ ...current, status: status as EnquiryStatus }))
              }
              options={[
                { label: "New", value: "new" },
                { label: "In progress", value: "in_progress" },
                { label: "Resolved", value: "resolved" },
                { label: "Spam", value: "spam" },
                { label: "Trash", value: "trash" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>
        <WorkspaceFormField label="Message">
          <Textarea
            value={value.message}
            onChange={(event) =>
              setValue((current) => ({ ...current, message: event.target.value }))
            }
            maxLength={3000}
            disabled={isSaving}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Internal notes">
          <Textarea
            value={value.notes}
            onChange={(event) => setValue((current) => ({ ...current, notes: event.target.value }))}
            maxLength={2000}
            disabled={isSaving}
          />
        </WorkspaceFormField>
        <div className="flex items-center gap-3">
          <Switch
            checked={value.consent}
            onCheckedChange={(consent) => setValue((current) => ({ ...current, consent }))}
            disabled={isSaving}
          />
          <span className="text-sm">Consent recorded</span>
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
