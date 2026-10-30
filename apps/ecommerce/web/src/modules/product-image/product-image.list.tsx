import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { ProductImageRecord } from "./product-image.types";
export const productimageListColumns = {"image": "Image", "productTitle": "Product", "variantTitle": "Variant", "sortOrder": "Order", "status": "Status"};

export function productimageListValues(record: ProductImageRecord) {
  return {
    image: record.altText,
    productTitle: `${record.productTitle} ${record.isPrimary ? "Primary" : ""}`,
    variantTitle: record.variantTitle || "All variants",
    sortOrder: record.sortOrder,
    status: record.status,
  };
}

export function ProductImageList({
  listTools, loading, onEdit, onStatus, records,
}: {
  listTools?: WorkspaceListTools;
  loading: boolean;
  onEdit: (record: ProductImageRecord) => void;
  onStatus: (record: ProductImageRecord) => void;
  records: ProductImageRecord[];
}) {
  const columns: ColumnDef<ProductImageRecord>[] = [
    { id: "image", header: "Image", accessorFn: (record) => productimageListValues(record).image, cell: ({ row }) => { const record = row.original; return <> <img
                  alt={record.altText}
                  className="size-12 rounded border object-cover"
                  src={record.url}
                /> </>; } },
    { id: "productTitle", header: "Product", accessorFn: (record) => productimageListValues(record).productTitle, cell: ({ row }) => { const record = row.original; return <> {record.productTitle}
                {record.isPrimary ? (
                  <span className="ml-2 text-xs text-primary">Primary</span>
                ) : null} </>; } },
    { id: "variantTitle", header: "Variant", accessorFn: (record) => productimageListValues(record).variantTitle, cell: ({ row }) => { const record = row.original; return <> {record.variantTitle || "All variants"} </>; } },
    { id: "sortOrder", header: "Order", accessorFn: (record) => productimageListValues(record).sortOrder, cell: ({ row }) => { const record = row.original; return <> {record.sortOrder} </>; } },
    { id: "status", header: "Status", accessorFn: (record) => productimageListValues(record).status, cell: ({ row }) => { const record = row.original; return <> <WorkspaceStatusBadge
                  label={record.status}
                  tone={record.status === "active" ? "success" : "neutral"}
                /> </>; } },
    { id: "actions", header: "Actions", enableSorting: false, cell: ({ row }) => { const record = row.original; return <> <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
                  Edit
                </Button>{" "}
                <Button size="sm" variant="outline" onClick={() => onStatus(record)}>
                  {record.status === "active" ? "Deactivate" : "Activate"}
                </Button> </>; } },
  ];
  return <WorkspaceTable columns={columns.filter((column) => !listTools?.hidden.includes(String(column.id)))} data={records} isLoading={loading} emptyState="No product image records found." minWidth="800px" {...(listTools?.showFilters ? { filterRow: listTools.filterRow } : {})} />;
}
