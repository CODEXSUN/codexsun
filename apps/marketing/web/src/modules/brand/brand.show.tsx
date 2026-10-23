import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable } from "@codexsun/ui/workspace/show";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useMarketingTransport } from "../../transport";
import { brandActivity } from "./brand.services";
import type { BrandRecord } from "./brand.types";
export function BrandShow({
  record,
  onClose,
  onEdit
}: {
  record: BrandRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  const api = useMarketingTransport();
  const activity = useQuery({
    queryKey: ["marketing", api.scopeKey, "brand-activity", record.uuid, record.updatedAt],
    queryFn: () => brandActivity(api, record.uuid)
  });
  return (
    <WorkspaceUpsertDialog
      open
      onClose={onClose}
      title={record.name}
      description="Brand details and activity."
    >
      <WorkspaceDetailTable
        rows={[
          ["Name", record.name],
          ["Timezone", record.timezone],
          ["Website", record.website],
          ["Status", record.status],
          ["Created", formatDateTime(record.createdAt)],
          ["Updated", formatDateTime(record.updatedAt)]
        ]}
      />
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
