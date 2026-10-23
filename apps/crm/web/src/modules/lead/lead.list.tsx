import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { LeadRecord } from "./lead.types";
export function LeadList({
  records,
  loading,
  onView
}: {
  records: LeadRecord[];
  loading: boolean;
  onView: (row: LeadRecord) => void;
}) {
  const columns: ColumnDef<LeadRecord>[] = [
    { accessorKey: "name", header: "PROSPECT" },
    { accessorKey: "campaignLabel", header: "CAMPAIGN" },
    { accessorKey: "assignedTo", header: "ASSIGNED TO" },
    {
      id: "status",
      header: "STATUS",
      cell: () => <WorkspaceStatusBadge label="Needs review" tone="warning" />
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <WorkspaceRowActions title={row.original.name} onView={() => onView(row.original)} />
        </div>
      )
    }
  ];
  return (
    <WorkspaceTable
      columns={columns}
      data={records}
      isLoading={loading}
      onRowClick={onView}
      emptyState="No leads assigned to you."
    />
  );
}
