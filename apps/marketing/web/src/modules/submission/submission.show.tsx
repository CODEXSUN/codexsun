import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable } from "@codexsun/ui/workspace/show";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import type { SubmissionRecord } from "./submission.types";
export function SubmissionShow({
  record,
  onClose,
  onRetry,
  pending
}: {
  record: SubmissionRecord;
  onClose: () => void;
  onRetry: () => void;
  pending: boolean;
}) {
  return (
    <WorkspaceUpsertDialog
      open
      title={record.name}
      description="Original capture evidence and CRM handoff."
      onClose={onClose}
    >
      <WorkspaceDetailTable
        rows={[
          ["Reference", record.uuid],
          ["Campaign", record.campaignLabel],
          ["Email", record.email],
          ["Phone", record.phone],
          ["Message", record.message],
          ["Capture notice version", record.noticeVersion],
          ["Capture notice", record.consentNotice],
          ["Received", formatDateTime(record.createdAt)],
          ["Original source", record.sourceReference],
          ["Source consent time", record.sourceConsentAt],
          ["Original notice version", record.sourceNoticeVersion],
          ["Marketing subscription", "Not granted by this capture"],
          ["Captured by", record.createdBy],
          ["Handoff", record.status],
          ["CRM Lead", record.leadUuid ?? "Pending"]
        ]}
      />
      <div className="flex justify-end gap-2 p-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {record.status === "pending" ? (
          <Button disabled={pending} onClick={onRetry}>
            Retry CRM handoff
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <a href={"/app/crm/leads?show=" + record.leadUuid}>Open CRM Leads</a>
          </Button>
        )}
      </div>
    </WorkspaceUpsertDialog>
  );
}
