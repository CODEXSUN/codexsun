import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { FeaturedCardRecord } from "./featured-card.types";

export const featuredcardListColumns = {"imageUrl": "Preview", "title": "Featured", "ishopItem": "Frappe item", "offerPrice": "Price", "displayOrder": "Order", "published": "Publication", "status": "Status"};

export function featuredcardListValues(record: FeaturedCardRecord) {
  return {
    imageUrl: record.imageUrl || "No image",
    title: `${record.title} ${record.featuredCode}`,
    ishopItem: record.ishopItem || "Not linked",
    offerPrice: record.offerPrice,
    displayOrder: record.displayOrder,
    published: record.published ? "Published" : "Draft",
    status: record.status,
  };
}

export function FeaturedCardList({
  listTools, loading, onEdit, onStatus, records,
}: {
  listTools?: WorkspaceListTools;
  loading: boolean;
  onEdit: (record: FeaturedCardRecord) => void;
  onStatus: (record: FeaturedCardRecord) => void;
  records: FeaturedCardRecord[];
}) {
  const columns: ColumnDef<FeaturedCardRecord>[] = [
    { id: "imageUrl", header: "Preview", accessorFn: (record) => featuredcardListValues(record).imageUrl, cell: ({ row }) => { const record = row.original; return <> {record.imageUrl ? (
                  <img
                    alt={record.title}
                    className="h-12 w-20 rounded border bg-muted/20 object-contain p-1"
                    src={record.imageUrl}
                  />
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )} </>; } },
    { id: "title", header: "Featured", accessorFn: (record) => featuredcardListValues(record).title, cell: ({ row }) => { const record = row.original; return <> <div className="font-medium">{record.title}</div>
                <div className="text-xs text-muted-foreground">{record.featuredCode}</div> </>; } },
    { id: "ishopItem", header: "Frappe item", accessorFn: (record) => featuredcardListValues(record).ishopItem, cell: ({ row }) => { const record = row.original; return <> {record.ishopItem || "Not linked"} </>; } },
    { id: "offerPrice", header: "Price", accessorFn: (record) => featuredcardListValues(record).offerPrice, cell: ({ row }) => { const record = row.original; return <> {record.offerPrice.toLocaleString()} </>; } },
    { id: "displayOrder", header: "Order", accessorFn: (record) => featuredcardListValues(record).displayOrder, cell: ({ row }) => { const record = row.original; return <> {record.displayOrder} </>; } },
    { id: "published", header: "Publication", accessorFn: (record) => featuredcardListValues(record).published, cell: ({ row }) => { const record = row.original; return <> {record.published ? "Published" : "Draft"} </>; } },
    { id: "status", header: "Status", accessorFn: (record) => featuredcardListValues(record).status, cell: ({ row }) => { const record = row.original; return <> <WorkspaceStatusBadge
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
  return <WorkspaceTable columns={columns.filter((column) => !listTools?.hidden.includes(String(column.id)))} data={records} isLoading={loading} emptyState="No featured card records found." minWidth="800px" {...(listTools?.showFilters ? { filterRow: listTools.filterRow } : {})} />;
}
