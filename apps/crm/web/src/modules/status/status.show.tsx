import { formatDateTime } from "@codexsun/ui/workspace";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable } from "@codexsun/ui/workspace/show";
import { WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import type { StatusRecord } from "./status.types";

export function StatusShow({
  record,
  onClose,
  onEdit
}: {
  record: StatusRecord | null;
  onClose: () => void;
  onEdit: (record: StatusRecord) => void;
}) {
  return (
    <WorkspaceUpsertDialog
      open={Boolean(record)}
      onClose={onClose}
      title={record?.name ?? "Status"}
      description="CRM enquiry reference details."
    >
      {record ? (
        <>
          <WorkspaceDetailTable
            rows={[
              ["Name", record.name],
              ["Code", record.code],
              ["Status", record.status],
              ["Sort order", record.sortOrder],
              ["Created", formatDateTime(record.createdAt)],
              ["Updated", formatDateTime(record.updatedAt)],
              ["Updated by", record.updatedBy]
            ]}
          />
          <div className="flex justify-end gap-2 p-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={() => onEdit(record)}>
              Edit
            </Button>
          </div>
        </>
      ) : null}
    </WorkspaceUpsertDialog>
  );
}
