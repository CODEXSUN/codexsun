import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable } from "@codexsun/ui/workspace";
import type { Association } from "./association.types";
export function AssociationList({
  records,
  onEdit
}: {
  records: Association[];
  onEdit: (record: Association) => void;
}) {
  return (
    <WorkspaceTable
      data={records}
      columns={[
        { accessorKey: "name", header: "Association" },
        { accessorKey: "industry", header: "Industry" },
        { accessorKey: "city", header: "City" },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <span
              className={row.original.status === "active" ? "text-emerald-700" : "text-amber-700"}
            >
              {row.original.status === "active" ? "Active" : "Inactive"}
            </span>
          )
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <Button variant="outline" onClick={() => onEdit(row.original)}>
              View / Edit
            </Button>
          )
        }
      ]}
      emptyState="No association records. Create the first record."
    />
  );
}
