import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { CampaignRecord } from "./campaign.types";
export function CampaignList({
  hiddenColumns = [],
  records,
  loading,
  onView,
  onEdit,
  onToggle
}: {
  hiddenColumns?: string[];
  records: CampaignRecord[];
  loading: boolean;
  onView: (record: CampaignRecord) => void;
  onEdit: (record: CampaignRecord) => void;
  onToggle: (record: CampaignRecord) => void;
}) {
  const columns: ColumnDef<CampaignRecord>[] = [
    { accessorKey: "name", header: "NAME" },
    { accessorKey: "updatedBy", header: "UPDATED BY" },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.status === "active" ? "Active" : "Inactive"}
          tone={row.original.status === "active" ? "success" : "neutral"}
        />
      )
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <WorkspaceRowActions
            title={row.original.name}
            onView={() => onView(row.original)}
            onEdit={() => onEdit(row.original)}
            isSuspended={row.original.status === "inactive"}
            onDelete={() => onToggle(row.original)}
            onRestore={() => onToggle(row.original)}
          />
        </div>
      )
    }
  ];
  return (
    <WorkspaceTable
      columns={columns.filter(
        (column) =>
          !hiddenColumns.includes(
            "accessorKey" in column ? String(column.accessorKey) : String(column.id)
          )
      )}
      data={records}
      isLoading={loading}
      onRowClick={onView}
      emptyState="No campaigns found."
    />
  );
}
