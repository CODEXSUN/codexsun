"use client";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { EnquiryRecord } from "./enquiry.types";
export function EnquiryList({
  records,
  isLoading,
  visibleColumns = {},
  filterRow,
  onView,
  onEdit,
  onDelete
}: {
  records: EnquiryRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  filterRow?: ((columnId: string) => React.ReactNode) | undefined;
  onView: (record: EnquiryRecord) => void;
  onEdit: (record: EnquiryRecord) => void;
  onDelete?: (record: EnquiryRecord) => void;
}) {
  const columns: ColumnDef<EnquiryRecord>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="text-foreground">{row.original.name || "—"}</span>
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-foreground">{row.original.email || "—"}</span>
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-foreground">{row.original.phone || "—"}</span>
    },
    {
      id: "interest",
      accessorKey: "interest",
      header: "Interest",
      cell: ({ row }) => <span className="text-foreground">{row.original.interest || "—"}</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <span className="text-foreground">{row.original.status || "—"}</span>
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <span className="text-foreground">{row.original.createdAt || "—"}</span>
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <WorkspaceRowActions
            title="Enquiry"
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
