import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { sliderImageSource } from "./storefront-slider.image-field";
import type { StorefrontSliderRecord } from "./storefront-slider.types";

export const storefrontsliderListColumns = {"imageUrl": "Preview", "title": "Slider", "ishopItem": "Frappe item", "displayOrder": "Order", "published": "Publication", "status": "Status"};

export function storefrontsliderListValues(record: StorefrontSliderRecord) {
  return {
    imageUrl: record.imageUrl || "No image",
    title: `${record.title} ${record.sliderCode}`,
    ishopItem: record.ishopItem || "Not linked",
    displayOrder: record.displayOrder,
    published: record.published ? "Published" : "Draft",
    status: record.status,
  };
}

export function StorefrontSliderList({
  listTools, loading, onEdit, onStatus, records,
}: {
  listTools?: WorkspaceListTools;
  loading: boolean;
  onEdit: (record: StorefrontSliderRecord) => void;
  onStatus: (record: StorefrontSliderRecord) => void;
  records: StorefrontSliderRecord[];
}) {
  const columns: ColumnDef<StorefrontSliderRecord>[] = [
    { id: "imageUrl", header: "Preview", accessorFn: (record) => storefrontsliderListValues(record).imageUrl, cell: ({ row }) => { const record = row.original; return <> {record.imageUrl ? (
                  <img
                    alt={record.title}
                    className="h-12 w-20 rounded border bg-muted/20 object-contain p-1"
                    src={sliderImageSource(record.imageUrl)}
                  />
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )} </>; } },
    { id: "title", header: "Slider", accessorFn: (record) => storefrontsliderListValues(record).title, cell: ({ row }) => { const record = row.original; return <> <div className="font-medium">{record.title}</div>
                <div className="text-xs text-muted-foreground">{record.sliderCode}</div> </>; } },
    { id: "ishopItem", header: "Frappe item", accessorFn: (record) => storefrontsliderListValues(record).ishopItem, cell: ({ row }) => { const record = row.original; return <> {record.ishopItem || "Not linked"} </>; } },
    { id: "displayOrder", header: "Order", accessorFn: (record) => storefrontsliderListValues(record).displayOrder, cell: ({ row }) => { const record = row.original; return <> {record.displayOrder} </>; } },
    { id: "published", header: "Publication", accessorFn: (record) => storefrontsliderListValues(record).published, cell: ({ row }) => { const record = row.original; return <> {record.published ? "Published" : "Draft"} </>; } },
    { id: "status", header: "Status", accessorFn: (record) => storefrontsliderListValues(record).status, cell: ({ row }) => { const record = row.original; return <> <WorkspaceStatusBadge
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
  return <WorkspaceTable columns={columns.filter((column) => !listTools?.hidden.includes(String(column.id)))} data={records} isLoading={loading} emptyState="No storefront slider records found." minWidth="800px" {...(listTools?.showFilters ? { filterRow: listTools.filterRow } : {})} />;
}
