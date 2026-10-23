import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { ConsentRecord } from "./consent.types";
export function ConsentList({
  records,
  loading,
  hiddenColumns,
  onView
}: {
  records: ConsentRecord[];
  loading: boolean;
  hiddenColumns: string[];
  onView: (record: ConsentRecord) => void;
}) {
  const columns: LegacyColumnDef<ConsentRecord>[] = [
    { accessorKey: "recipient", header: "RECIPIENT" },
    { accessorKey: "brandUuid", header: "BRAND" },
    {
      accessorKey: "action",
      header: "EVIDENCE",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.action === "grant" ? "Grant recorded" : "Withdrawal recorded"}
          tone={row.original.action === "grant" ? "success" : "warning"}
        />
      )
    },
    { accessorKey: "noticeVersion", header: "NOTICE VERSION" },
    { accessorKey: "createdBy", header: "RECORDED BY" },
    { accessorKey: "createdAt", header: "RECORDED AT" }
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
      emptyState="No promotional consent evidence."
    />
  );
}
