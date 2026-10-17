import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { SeasonStripRecord } from "./season-strip.types";

export const seasonstripListColumns = {"imageUrl": "Preview", "title": "Season", "ishopItem": "Frappe item", "offerPrice": "Price", "displayOrder": "Order", "published": "Publication", "status": "Status"};

export function seasonstripListValues(record: SeasonStripRecord) {
  return {
    imageUrl: record.imageUrl || "No image",
    title: `${record.title} ${record.seasonCode}`,
    ishopItem: record.ishopItem || "Not linked",
    offerPrice: record.offerPrice,
    displayOrder: record.displayOrder,
    published: record.published ? "Published" : "Draft",
    status: record.status,
  };
}

export function SeasonStripList({
  listTools, loading, onEdit, onStatus, records,
}: {
  listTools?: WorkspaceListTools;
  loading: boolean;
  onEdit: (record: SeasonStripRecord) => void;
  onStatus: (record: SeasonStripRecord) => void;
  records: SeasonStripRecord[];
}) {
  const columns: ColumnDef<SeasonStripRecord>[] = [
    { id: "imageUrl", header: "Preview", accessorFn: (record) => seasonstripListValues(record).imageUrl, cell: ({ row }) => { const record = row.original; return <> {record.imageUrl ? (
                  <img
                    alt={record.title}
                    className="h-12 w-20 rounded border bg-muted/20 object-contain p-1"
                    src={record.imageUrl}
                  />
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )} </>; } },
    { id: "title", header: "Season", accessorFn: (record) => seasonstripListValues(record).title, cell: ({ row }) => { const record = row.original; return <> <div className="font-medium">{record.title}</div>
                <div className="text-xs text-muted-foreground">{record.seasonCode}</div> </>; } },
    { id: "ishopItem", header: "Frappe item", accessorFn: (record) => seasonstripListValues(record).ishopItem, cell: ({ row }) => { const record = row.original; return <> {record.ishopItem || "Not linked"} </>; } },
    { id: "offerPrice", header: "Price", accessorFn: (record) => seasonstripListValues(record).offerPrice, cell: ({ row }) => { const record = row.original; return <> {record.offerPrice.toLocaleString()} </>; } },
    { id: "displayOrder", header: "Order", accessorFn: (record) => seasonstripListValues(record).displayOrder, cell: ({ row }) => { const record = row.original; return <> {record.displayOrder} </>; } },
    { id: "published", header: "Publication", accessorFn: (record) => seasonstripListValues(record).published, cell: ({ row }) => { const record = row.original; return <> {record.published ? "Published" : "Draft"} </>; } },
    { id: "status", header: "Status", accessorFn: (record) => seasonstripListValues(record).status, cell: ({ row }) => { const record = row.original; return <> <WorkspaceStatusBadge
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
  return <WorkspaceTable columns={columns.filter((column) => !listTools?.hidden.includes(String(column.id)))} data={records} isLoading={loading} emptyState="No season strip records found." minWidth="800px" {...(listTools?.showFilters ? { filterRow: listTools.filterRow } : {})} />;
}
