import { CapturePublication } from "./capture.publication";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable } from "@codexsun/ui/workspace/show";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useMarketingTransport } from "../../transport";
import { captureActivity } from "./capture.services";
import type { CaptureRecord } from "./capture.types";
export function CaptureShow({
  record,
  onClose,
  onEdit
}: {
  record: CaptureRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  const api = useMarketingTransport();
  const activity = useQuery({
    queryKey: ["marketing", api.scopeKey, "capture-activity", record.uuid, record.updatedAt],
    queryFn: () => captureActivity(api, record.uuid)
  });
  return (
    <WorkspaceUpsertDialog
      open
      onClose={onClose}
      title={record.name}
      description="Capture form details and activity."
    >
      <WorkspaceDetailTable
        rows={[
          ["Brand", record.brandUuid],
          ["Campaign", record.campaignUuid],
          ["Name", record.name],
          ["Allowed Origin", record.allowedOrigin],
          ["Consent Notice", record.consentNotice],
          ["Notice Version", record.noticeVersion],
          ["Status", record.status],
          ["Created", formatDateTime(record.createdAt)],
          ["Updated", formatDateTime(record.updatedAt)]
        ]}
      />
      <CapturePublication record={record} />
      <h3 className="px-4 font-medium">Activity</h3>
      {activity.error ? <p role="alert">{activity.error.message}</p> : null}
      <WorkspaceDetailTable
        rows={(activity.data ?? []).map((item, index) => [
          formatDateTime(item.occurredAt) + " #" + (index + 1),
          item.action + " by " + item.actor
        ])}
      />
      <div className="flex justify-end gap-2 p-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>Edit</Button>
      </div>
    </WorkspaceUpsertDialog>
  );
}
