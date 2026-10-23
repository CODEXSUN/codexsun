import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable } from "@codexsun/ui/workspace/show";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useMarketingTransport } from "../../transport";
import { campaignActivity } from "./campaign.services";
import type { CampaignRecord } from "./campaign.types";
export function CampaignShow({
  record,
  onClose,
  onEdit
}: {
  record: CampaignRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  const api = useMarketingTransport();
  const client = useQueryClient();
  const duplicate = useMutation({
    mutationFn: (name: string) =>
      api.post("/marketing/campaigns/" + record.uuid + "/duplicate", { name }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["marketing", api.scopeKey] });
      toast.success("Inactive campaign copy created. Review it before activation.");
      onClose();
    },
    onError: (error) => toast.error(error.message)
  });
  const tracking = record.landingUrl ? new URL(record.landingUrl) : null;
  if (tracking) {
    tracking.searchParams.set("utm_campaign", record.name);
    tracking.searchParams.set("utm_id", record.uuid);
    tracking.searchParams.set("utm_source", record.channel);
  }

  const activity = useQuery({
    queryKey: ["marketing", api.scopeKey, "campaign-activity", record.uuid, record.updatedAt],
    queryFn: () => campaignActivity(api, record.uuid)
  });
  return (
    <WorkspaceUpsertDialog
      open
      onClose={onClose}
      title={record.name}
      description="Campaign details and activity."
    >
      <WorkspaceDetailTable
        rows={[
          ["Brand", record.brandUuid],
          ["Name", record.name],
          ["Objective", record.objective],
          ["Channel", record.channel],
          ["Landing Url", record.landingUrl],
          ["Status", record.status],
          ["Tracking link", tracking?.toString() ?? "Set a landing URL to create a tracking link."],
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
        <Button
          variant="outline"
          disabled={duplicate.isPending}
          onClick={() => {
            const name = window.prompt(
              "Name for the inactive campaign copy",
              ("Copy of " + record.name).slice(0, 160)
            );
            if (name?.trim()) duplicate.mutate(name.trim());
          }}
        >
          Duplicate as draft
        </Button>
        <Button onClick={onEdit}>Edit</Button>
      </div>
    </WorkspaceUpsertDialog>
  );
}
