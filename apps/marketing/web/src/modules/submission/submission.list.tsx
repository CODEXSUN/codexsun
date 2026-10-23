import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { SubmissionRecord } from "./submission.types";
export function SubmissionList({
  hiddenColumns = [],
  records,
  loading,
  onView
}: {
  hiddenColumns?: string[];
  records: SubmissionRecord[];
  loading: boolean;
  onView: (row: SubmissionRecord) => void;
}) {
  const columns: ColumnDef<SubmissionRecord>[] = [
    { accessorKey: "name", header: "NAME" },
    { accessorKey: "campaignLabel", header: "CAMPAIGN" },
    { accessorKey: "email", header: "EMAIL" },
    { accessorKey: "phone", header: "PHONE" },
    {
      accessorKey: "status",
      header: "HANDOFF",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.status === "delivered" ? "CRM linked" : "Pending handoff"}
          tone={row.original.status === "delivered" ? "success" : "warning"}
        />
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
      emptyState="No captured submissions."
    />
  );
}
