import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable, WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { WorkspaceFormBanner, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace";
import { useDepartmentActivity } from "./department.hooks";
import type { DepartmentGateway } from "./department.services";
import type { DepartmentRecord } from "./department.types";

export function DepartmentShow({
  department,
  gateway,
  onClose,
  onEdit
}: {
  department: DepartmentRecord | null;
  gateway: DepartmentGateway;
  onClose: () => void;
  onEdit: (department: DepartmentRecord) => void;
}) {
  const activity = useDepartmentActivity(gateway, department?.id ?? null);
  return (
    <WorkspaceUpsertDialog
      open={Boolean(department)}
      title={department?.name ?? "Department"}
      className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
      onClose={onClose}
    >
      {department && (
        <div className="space-y-4">
          {!department.deletedAt && (
            <Button variant="outline" onClick={() => onEdit(department)}>
              Edit department
            </Button>
          )}
          <WorkspaceShowCard title="Department details">
            <WorkspaceDetailTable
              rows={[
                ["Name", department.name],
                ["Description", department.description || "—"],
                [
                  "Status",
                  department.deletedAt
                    ? "Deleted"
                    : department.status === "active"
                      ? "Active"
                      : "Inactive"
                ],
                ["Created", formatDateTime(department.createdAt)],
                ["Updated", formatDateTime(department.updatedAt)]
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
