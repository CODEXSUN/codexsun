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
import { eventSchema } from "./event.schema";
import type { EventRecord, EventSavePayload, EventStatus } from "./event.types";
export function EventForm({
  formId,
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  formId?: string;
  initialRecord?: EventRecord | null;
  isSaving: boolean;
  onSubmit: (payload: EventSavePayload) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<EventSavePayload>({
    title: initialRecord?.title ?? "",
    eventType: initialRecord?.eventType ?? "demonstration",
    description: initialRecord?.description ?? "",
    eventDate: initialRecord?.eventDate ?? "",
    endDate: initialRecord?.endDate ?? null,
    location: initialRecord?.location ?? "",
    isApprovedPublic: initialRecord?.isApprovedPublic ?? false,
    status: initialRecord?.status ?? "upcoming",
    revision: initialRecord?.revision ?? 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = eventSchema.safeParse(value);
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
          <WorkspaceFormField label="Event title" required>
            <Input
              value={value.title}
              onChange={(event) =>
                setValue((current) => ({ ...current, title: event.target.value }))
              }
              disabled={isSaving}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Event type" required>
            <WorkspaceSelect
              value={value.eventType}
              onValueChange={(eventType) =>
                setValue((current) => ({
                  ...current,
                  eventType: eventType as EventSavePayload["eventType"]
                }))
              }
              options={[
                { label: "Demonstration", value: "demonstration" },
                { label: "Tournament", value: "tournament" },
                { label: "Workshop", value: "workshop" },
                { label: "Camp", value: "camp" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
          <WorkspaceFormField label="Start date" required>
            <Input
              type="date"
              value={value.eventDate}
              onChange={(event) =>
                setValue((current) => ({ ...current, eventDate: event.target.value }))
              }
              disabled={isSaving}
            />
            {errors.eventDate ? (
              <p className="text-xs text-destructive">{errors.eventDate}</p>
            ) : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="End date">
            <Input
              type="date"
              value={value.endDate ?? ""}
              onChange={(event) =>
                setValue((current) => ({ ...current, endDate: event.target.value || null }))
              }
              disabled={isSaving}
            />
          </WorkspaceFormField>
          <WorkspaceFormField label="Location" required>
            <Input
              value={value.location}
              onChange={(event) =>
                setValue((current) => ({ ...current, location: event.target.value }))
              }
              disabled={isSaving}
            />
            {errors.location ? <p className="text-xs text-destructive">{errors.location}</p> : null}
          </WorkspaceFormField>
          <WorkspaceFormField label="Status" required>
            <WorkspaceSelect
              value={value.status}
              onValueChange={(status) =>
                setValue((current) => ({ ...current, status: status as EventStatus }))
              }
              options={[
                { label: "Upcoming", value: "upcoming" },
                { label: "Ongoing", value: "ongoing" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>
        </div>
        <WorkspaceFormField label="Description">
          <Textarea
            value={value.description}
            onChange={(event) =>
              setValue((current) => ({ ...current, description: event.target.value }))
            }
            maxLength={3000}
            disabled={isSaving}
          />
        </WorkspaceFormField>
        <div className="flex items-center gap-3">
          <Switch
            checked={value.isApprovedPublic}
            onCheckedChange={(isApprovedPublic) =>
              setValue((current) => ({ ...current, isApprovedPublic }))
            }
            disabled={isSaving}
          />
          <span className="text-sm">Approved for public site</span>
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
