import { Button } from "@codexsun/ui/components/button";
import {
  WorkspaceTable,
  WorkspaceStatusBadge,
  WorkspaceTableEmptyState,
  formatDateTime
} from "@codexsun/ui/workspace";
import type { RequirementRecord } from "./requirements.types";
export function RequirementsList({
  records,
  loading,
  onSelect
}: {
  records: RequirementRecord[];
  loading: boolean;
  onSelect: (record: RequirementRecord) => void;
}) {
  return (
    <WorkspaceTable
      data={records}
      isLoading={loading}
      onRowClick={onSelect}
      emptyState={<WorkspaceTableEmptyState>No requirements found.</WorkspaceTableEmptyState>}
      columns={[
        {
          accessorKey: "title",
          header: "Requirement",
          cell: ({ row }) => (
            <Button
              variant="link"
              className="h-auto p-0 text-left"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(row.original);
              }}
            >
              {row.original.title}
            </Button>
          )
        },
        { accessorKey: "priority", header: "Priority" },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <WorkspaceStatusBadge
              label={row.original.status.replaceAll("_", " ")}
              tone={
                row.original.status === "approved"
                  ? "success"
                  : row.original.status === "rejected"
                    ? "danger"
                    : "warning"
              }
            />
          )
        },
        { accessorKey: "origin", header: "Source" },
        {
          accessorKey: "updatedAt",
          header: "Updated",
          cell: ({ row }) => formatDateTime(row.original.updatedAt)
        }
      ]}
    />
  );
}
