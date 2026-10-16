import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { ProductInformationRecord } from "./product-information.types";
export function ProductInformationList({
  loading,
  onArchive,
  onEdit,
  records
}: {
  loading: boolean;
  onArchive: (record: ProductInformationRecord) => void;
  onEdit: (record: ProductInformationRecord) => void;
  records: ProductInformationRecord[];
}) {
  if (loading)
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Loading product information...
      </div>
    );
  if (!records.length)
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        No ecommerce product information found.
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left">Storefront product</th>
            <th className="px-4 py-3 text-left">Core product</th>
            <th className="px-4 py-3 text-left">Brand</th>
            <th className="px-4 py-3 text-left">Slug</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr className="border-b last:border-0" key={record.id}>
              <td className="px-4 py-3 font-medium">{record.storefrontTitle}</td>
              <td className="px-4 py-3">{record.coreProductName}</td>
              <td className="px-4 py-3">{record.brandName || "-"}</td>
              <td className="px-4 py-3 text-muted-foreground">/{record.slug}</td>
              <td className="px-4 py-3">
                <WorkspaceStatusBadge
                  label={record.publicationStatus}
                  tone={
                    record.publicationStatus === "published"
                      ? "success"
                      : record.publicationStatus === "archived"
                        ? "warning"
                        : "neutral"
                  }
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
                    Edit
                  </Button>
                  {record.publicationStatus !== "archived" ? (
                    <Button size="sm" variant="outline" onClick={() => onArchive(record)}>
                      Archive
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
