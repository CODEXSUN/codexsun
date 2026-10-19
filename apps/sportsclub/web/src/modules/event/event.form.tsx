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
import { eventSchema } from "./event.schema";
import type { EventRecord, EventSavePayload, EventStatus } from "./event.types";

const defaultPayload: EventSavePayload = {
  title: "",
  eventType: "demonstration",
  eventDate: new Date().toISOString().split("T")[0]!,
  venue: "Tenkasi Sports Pavilion / மைதானம்",
  description: "",
  isApprovedPublic: true,
  status: "upcoming"
};

export function EventForm({
  initialRecord,
  isSaving,
  onSubmit,
  onCancel
}: {
  initialRecord?: EventRecord | null;
  isSaving: boolean;
  onSubmit: (payload: EventSavePayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<EventSavePayload>(() =>
    initialRecord
      ? {
          title: initialRecord.title,
          eventType: initialRecord.eventType,
          eventDate: initialRecord.eventDate,
          venue: initialRecord.venue,
          description: initialRecord.description,
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
        eventType: initialRecord.eventType,
        eventDate: initialRecord.eventDate,
        venue: initialRecord.venue,
        description: initialRecord.description,
        isApprovedPublic: initialRecord.isApprovedPublic,
        status: initialRecord.status
      });
    }
  }, [initialRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = eventSchema.safeParse(formData);
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
          <WorkspaceFormField label="Event Title" required={true}>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Silambam Gurukulam Annual Tournament"
              disabled={isSaving}
            />
            {errors.title ? <span className="text-xs text-destructive">{errors.title}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Event Type" required={true}>
            <WorkspaceSelect
              value={formData.eventType}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  eventType: val as "tournament" | "demonstration" | "workshop" | "camp"
                })
              }
              options={[
                { label: "Demonstration / செயல்முறை விளக்கம்", value: "demonstration" },
                { label: "Tournament / சிலம்பப் போட்டி", value: "tournament" },
                { label: "Workshop / சிறப்புப் பயிலரங்கம்", value: "workshop" },
                { label: "Summer Camp / விடுமுறைப் பயிற்சி முகாம்", value: "camp" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <WorkspaceFormField label="Event Date" required={true}>
            <Input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              disabled={isSaving}
            />
            {errors.eventDate ? (
              <span className="text-xs text-destructive">{errors.eventDate}</span>
            ) : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Venue Location" required={true}>
            <Input
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g. Tenkasi Sports Pavilion"
              disabled={isSaving}
            />
            {errors.venue ? <span className="text-xs text-destructive">{errors.venue}</span> : null}
          </WorkspaceFormField>

          <WorkspaceFormField label="Status" required={true}>
            <WorkspaceSelect
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val as EventStatus })}
              options={[
                { label: "Upcoming", value: "upcoming" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" }
              ]}
              disabled={isSaving}
            />
          </WorkspaceFormField>

          <div className="flex flex-col justify-center space-y-1 rounded-md border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Approved for Public Listing</span>
              <Switch
                checked={formData.isApprovedPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isApprovedPublic: checked })
                }
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, this event is published on the tenkasisports public portal.
            </p>
          </div>
        </div>

        <WorkspaceFormField label="Description & Guidelines" required={true}>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Event itinerary, participating categories, age limits, and instructions..."
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
          {initialRecord ? "Save Changes" : "Create Event"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </WorkspaceFormActions>
    </form>
  );
}
