import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { ProductVariantRecord } from "./product-variant.types";
export function ProductVariantList({
  loading,
  onEdit,
  onStatus,
  records
}: {
  loading: boolean;
  onEdit: (record: ProductVariantRecord) => void;
  onStatus: (record: ProductVariantRecord) => void;
  records: ProductVariantRecord[];
}) {
  if (loading || !records.length)
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        {loading ? "Loading variants..." : "No variants found."}
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Variant</th>
            <th className="px-4 py-3 text-left">Product</th>
            <th className="px-4 py-3 text-left">Options</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr className="border-b" key={record.id}>
              <td className="px-4 py-3 font-mono">{record.sku}</td>
              <td className="px-4 py-3 font-medium">{record.title}</td>
              <td className="px-4 py-3">{record.productTitle}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {[record.option1Value, record.option2Value, record.option3Value]
                  .filter(Boolean)
                  .join(" / ") || "Default"}
              </td>
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
