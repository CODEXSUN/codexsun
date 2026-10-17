import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable } from "@codexsun/ui/workspace";
import type { Product } from "./product.types";
export function ProductList({
  records,
  onEdit
}: {
  records: Product[];
  onEdit: (record: Product) => void;
}) {
  return (
    <WorkspaceTable
      data={records}
      columns={[
        { accessorKey: "name", header: "Product" },
        { accessorKey: "category", header: "Category" },
        {
          accessorKey: "price",
          header: "Price (INR)",
          cell: ({ row }) =>
            row.original.price === null ? "On request" : row.original.price.toLocaleString("en-IN")
        },
        { accessorKey: "unit", header: "Unit" },
        { accessorKey: "minimumOrder", header: "Minimum order" },
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
      emptyState="No products yet. Add your first product."
    />
  );
}
