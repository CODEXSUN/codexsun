import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable, WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import type { LeadRecord } from "./lead.types";
export function LeadShow({ record, onClose }: { record: LeadRecord; onClose: () => void }) {
  return (
    <WorkspaceUpsertDialog
      open
      title={record.name}
      description="Review the source prospect before creating or merging contact identity."
      onClose={onClose}
    >
      <WorkspaceShowCard title="Lead details">
        <WorkspaceDetailTable
          rows={[
            ["Reference", record.uuid],
            ["Campaign", record.campaignLabel],
            ["Name", record.name],
            ["Email", record.email],
            ["Phone", record.phone],
            ["Message", record.message],
            ["Assigned to", record.assignedTo],
            ["Status", "Needs review"],
            ["Contact identity", "Not merged. A shared email or phone is insufficient proof."],
            ["Source", record.source],
            ["Submission", record.submissionUuid]
          ]}
        />
      </WorkspaceShowCard>
      <div className="flex justify-end gap-2 p-4">
        <Button variant="outline" onClick={onClose}>
          Back
        </Button>
        {record.taskId ? (
          <Button asChild>
            <a href={"/app/crm/tasks/" + record.taskId}>Open follow-up task</a>
          </Button>
        ) : null}
      </div>
    </WorkspaceUpsertDialog>
  );
}
