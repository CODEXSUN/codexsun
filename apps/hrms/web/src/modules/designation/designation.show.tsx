import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable, WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { WorkspaceFormBanner, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace";
import { useDesignationActivity } from "./designation.hooks";
import type { DesignationGateway } from "./designation.services";
import type { DesignationRecord } from "./designation.types";

export function DesignationShow({
  designation,
  gateway,
  onClose,
  onEdit
}: {
  designation: DesignationRecord | null;
  gateway: DesignationGateway;
  onClose: () => void;
  onEdit: (designation: DesignationRecord) => void;
}) {
  const activity = useDesignationActivity(gateway, designation?.id ?? null);
  return (
    <WorkspaceUpsertDialog
      open={Boolean(designation)}
      title={designation?.name ?? "Designation"}
      className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
      onClose={onClose}
    >
      {designation && (
        <div className="space-y-4">
          {!designation.deletedAt && (
            <Button variant="outline" onClick={() => onEdit(designation)}>
              Edit designation
            </Button>
          )}
          <WorkspaceShowCard title="Designation details">
            <WorkspaceDetailTable
              rows={[
                ["Name", designation.name],
                ["Description", designation.description || "—"],
                [
                  "Status",
                  designation.deletedAt
                    ? "Deleted"
                    : designation.status === "active"
                      ? "Active"
                      : "Inactive"
                ],
                ["Created", formatDateTime(designation.createdAt)],
                ["Updated", formatDateTime(designation.updatedAt)]
              ]}
            />
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Activity">
            {activity.isPending && <p className="p-4 text-sm">Loading activity…</p>}
            {activity.isError && (
              <WorkspaceFormBanner title="Activity could not be loaded">
                {activity.error.message}
              </WorkspaceFormBanner>
            )}
            {activity.data?.map((item) => (
              <div key={item.id} className="border-b p-3 text-sm">
                <p>{item.summary}</p>
                <p className="text-muted-foreground">
                  {item.actorEmail} · {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
            {activity.isSuccess && !activity.data.length && (
              <p className="p-4 text-sm">No activity recorded.</p>
            )}
          </WorkspaceShowCard>
        </div>
      )}
    </WorkspaceUpsertDialog>
  );
}
