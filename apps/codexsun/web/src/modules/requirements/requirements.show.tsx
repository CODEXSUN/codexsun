import type { ReactNode } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import { WorkspaceShowCard, WorkspaceDetailTable, formatDateTime } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { RequirementActivity, RequirementRecord } from "./requirements.types";

interface RequirementsShowProps {
  record: RequirementRecord;
  actorEmail: string;
  permissions: Record<string, boolean>;
  readOnly: boolean;
  busy: boolean;
  note: string;
  activity: RequirementActivity[];
  activityLoading: boolean;
  activityError?: string;
  editForm?: ReactNode;
  onClose: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onNoteChange: (note: string) => void;
  onDecision: (decision: "approved" | "rejected") => void;
}

export function RequirementsShow({
  record,
  actorEmail,
  permissions,
  readOnly,
  busy,
  note,
  activity,
  activityLoading,
  activityError,
  editForm,
  onClose,
  onEdit,
  onSubmit,
  onNoteChange,
  onDecision
}: RequirementsShowProps) {
  const canEdit =
    !readOnly &&
    (record.status === "draft" || record.status === "rejected") &&
    record.createdBy === actorEmail &&
    permissions["codexsun.requirements.update"];
  const canDecide =
    !readOnly &&
    record.status === "awaiting_approval" &&
    permissions["codexsun.requirements.approve"];
  return (
    <WorkspaceShowCard title={record.title}>
      <WorkspaceDetailTable
        rows={[
          ["Request", <span className="whitespace-pre-wrap">{record.description}</span>],
          ["Status", record.status.replaceAll("_", " ")],
          ["Revision", record.revision],
          ["Priority", record.priority],
          ["Source", record.origin],
          ["Created", `${formatDateTime(record.createdAt)} · ${record.createdBy}`],
          ["Updated", formatDateTime(record.updatedAt)],
          ["Decision note", record.decisionNote || "No decision yet"]
        ]}
      />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {typeof window !== "undefined" && "speechSynthesis" in window && (
            <Button
              variant="outline"
              onClick={() => {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(
                  new SpeechSynthesisUtterance(`${record.title}. ${record.description}`)
                );
              }}
            >
              Read aloud
            </Button>
          )}
          {canEdit && (
            <>
              <Button variant="outline" disabled={busy} onClick={onEdit}>
                Edit
              </Button>
              {record.status === "draft" && (
                <Button disabled={busy} onClick={onSubmit}>
                  Send for approval
                </Button>
              )}
            </>
          )}
        </div>
        {canEdit && editForm}
        {canDecide && (
          <>
            <label className="block text-sm font-medium" htmlFor="codexsun-decision-note">
              Decision note
            </label>
            <Textarea
              id="codexsun-decision-note"
              value={note}
              disabled={busy}
              maxLength={2000}
              onChange={(event) => onNoteChange(event.target.value)}
            />
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => onDecision("approved")}>
                Approve
              </Button>
              <Button variant="destructive" disabled={busy} onClick={() => onDecision("rejected")}>
                Reject
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Approves this requirement revision. Worker execution and deployment are later phases.
            </p>
          </>
        )}
        <h3 className="text-sm font-semibold">Activity</h3>
        {activityLoading && <Skeleton className="h-12" />}
        {activityError && (
          <WorkspaceFormBanner title="Activity unavailable">{activityError}</WorkspaceFormBanner>
        )}
        {activity.map((event) => (
          <p key={event.uuid} className="text-sm">
            {formatDateTime(event.createdAt)} · {event.action} · revision {event.revision} ·{" "}
            {event.actorEmail}
            {event.note ? ` · ${event.note}` : ""}
          </p>
        ))}
      </div>
    </WorkspaceShowCard>
  );
}
