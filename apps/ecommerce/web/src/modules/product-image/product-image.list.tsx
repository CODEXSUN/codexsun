import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { ProductImageRecord } from "./product-image.types";
export function ProductImageList({
  loading,
  onEdit,
  onStatus,
  records
}: {
  loading: boolean;
  onEdit: (record: ProductImageRecord) => void;
  onStatus: (record: ProductImageRecord) => void;
  records: ProductImageRecord[];
}) {
  if (loading || !records.length)
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        {loading ? "Loading product images..." : "No product images found."}
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left">Image</th>
            <th className="px-4 py-3 text-left">Product</th>
            <th className="px-4 py-3 text-left">Variant</th>
            <th className="px-4 py-3 text-left">Order</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr className="border-b" key={record.id}>
              <td className="px-4 py-3">
                <img
                  alt={record.altText}
                  className="size-12 rounded border object-cover"
                  src={record.url}
                />
              </td>
              <td className="px-4 py-3 font-medium">
                {record.productTitle}
                {record.isPrimary ? (
                  <span className="ml-2 text-xs text-primary">Primary</span>
                ) : null}
              </td>
              <td className="px-4 py-3">{record.variantTitle || "All variants"}</td>
              <td className="px-4 py-3">{record.sortOrder}</td>
              <td className="px-4 py-3">
                <WorkspaceStatusBadge
                  label={record.status}
                  tone={record.status === "active" ? "success" : "neutral"}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
                  Edit
                </Button>{" "}
                <Button size="sm" variant="outline" onClick={() => onStatus(record)}>
                  {record.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
