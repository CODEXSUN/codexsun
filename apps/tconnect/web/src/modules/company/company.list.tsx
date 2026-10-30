import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable } from "@codexsun/ui/workspace";
import type { Company } from "./company.types";
export function CompanyList({
  records,
  onEdit
}: {
  records: Company[];
  onEdit: (record: Company) => void;
}) {
  return (
    <WorkspaceTable
      data={records}
      columns={[
        { accessorKey: "name", header: "Company" },
        { accessorKey: "industry", header: "Industry" },
        { accessorKey: "city", header: "City" },
        { accessorKey: "role", header: "Business type" },
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
      emptyState="No company records. Create the first record."
    />
  );
}
