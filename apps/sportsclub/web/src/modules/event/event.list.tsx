"use client";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { EventRecord } from "./event.types";
export function EventList({
  records,
  isLoading,
  visibleColumns = {},
  filterRow,
  onView,
  onEdit,
  onDelete
}: {
  records: EventRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  filterRow?: ((columnId: string) => React.ReactNode) | undefined;
  onView: (record: EventRecord) => void;
  onEdit: (record: EventRecord) => void;
  onDelete?: (record: EventRecord) => void;
}) {
  const columns: ColumnDef<EventRecord>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Event",
      cell: ({ row }) => <span className="text-foreground">{row.original.title || "—"}</span>
    },
    {
      id: "eventType",
      accessorKey: "eventType",
      header: "Type",
      cell: ({ row }) => <span className="text-foreground">{row.original.eventType || "—"}</span>
    },
    {
      id: "eventDate",
      accessorKey: "eventDate",
      header: "Date",
      cell: ({ row }) => <span className="text-foreground">{row.original.eventDate || "—"}</span>
    },
    {
      id: "location",
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => <span className="text-foreground">{row.original.location || "—"}</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <span className="text-foreground">{row.original.status || "—"}</span>
    },
    {
      id: "isApprovedPublic",
      accessorKey: "isApprovedPublic",
      header: "Public",
      cell: ({ row }) => (row.original.isApprovedPublic ? "Yes" : "No")
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <WorkspaceRowActions
            title="Event"
            onView={() => onView(row.original)}
            onEdit={() => onEdit(row.original)}
            {...(onDelete ? { onDelete: () => onDelete(row.original), deleteLabel: "Delete" } : {})}
          />
        </div>
      )
    }
  ];
  return (
    <WorkspaceTable
      columns={columns.filter(
        (column) => column.id === "actions" || visibleColumns[String(column.id)] !== false
      )}
      data={records}
      isLoading={isLoading}
      onRowClick={onView}
      {...(filterRow ? { filterRow } : {})}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">No records found.</div>
      }
    />
  );
}
