import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable } from "@codexsun/ui/workspace";
import type { Requirement } from "./requirement.types";
export function RequirementList({
  records,
  loading,
  onEdit,
  onReply,
  onViewReplies
}: {
  records: Requirement[];
  loading: boolean;
  onViewReplies?: ((record: Requirement) => void) | undefined;
  onReply?: ((record: Requirement) => void) | undefined;
  onEdit?: ((record: Requirement) => void) | undefined;
}) {
  return (
    <WorkspaceTable
      data={records}
      isLoading={loading}
      emptyState="No requirements yet."
      columns={[
        { accessorKey: "title", header: "Requirement" },
        { accessorKey: "category", header: "Category" },
        { accessorKey: "description", header: "Specifications" },
        { accessorKey: "quantity", header: "Quantity" },
        { accessorKey: "deliveryCity", header: "Deliver to" },
        {
          accessorKey: "budget",
          header: "Budget (INR)",
          cell: ({ row }) =>
            row.original.budget === null
              ? "On discussion"
              : row.original.budget.toLocaleString("en-IN")
        },
        { accessorKey: "status", header: "Status" },
        ...(onViewReplies
          ? [
              {
                id: "replies",
                header: "Seller responses",
                cell: ({ row }: { row: { original: Requirement } }) => (
                  <Button variant="outline" onClick={() => onViewReplies(row.original)}>
                    View replies & quotes
                  </Button>
                )
              }
            ]
          : []),
        ...(onReply
          ? [
              {
                id: "reply",
                header: "Connect",
                cell: ({ row }: { row: { original: Requirement } }) => (
                  <Button variant="outline" onClick={() => onReply(row.original)}>
                    Reply / Quote
                  </Button>
                )
              }
            ]
          : []),
        ...(onEdit
          ? [
              {
                id: "actions",
                header: "Actions",
                cell: ({ row }: { row: { original: Requirement } }) => (
                  <Button variant="outline" onClick={() => onEdit(row.original)}>
                    Edit
                  </Button>
                )
              }
            ]
          : [])
      ]}
    />
  );
}
