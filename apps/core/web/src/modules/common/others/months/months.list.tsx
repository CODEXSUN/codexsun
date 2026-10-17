import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { Trash2 } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { formatDate } from "@codexsun/ui/workspace";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { MonthsRecord } from "./months.types";

export const monthsListColumns = {
  name: "Name",
  startDate: "Start date",
  endDate: "End date",
  isActive: "Status"
};

export function MonthsList({
  listTools,
  loading,
  onEdit,
  onForceDelete,
  onRestore,
  onSuspend,
  records
}: {
  listTools?: WorkspaceListTools;
  loading: boolean;
  onEdit: (record: MonthsRecord) => void;
  onForceDelete: (record: MonthsRecord) => void;
  onRestore: (record: MonthsRecord) => void;
  onSuspend: (record: MonthsRecord) => void;
  records: MonthsRecord[];
}) {
  const columns: ColumnDef<MonthsRecord>[] = [
    {
      accessorKey: "sortOrder",
      cell: ({ row }) => <div className="text-center tabular-nums">{row.original.sortOrder}</div>,
      header: () => <div className="text-center">#</div>,
      size: 64
    },
    {
      accessorKey: "name",
      cell: ({ row }) => (
        <button
          className="cursor-pointer font-medium text-foreground hover:underline"
          onClick={() => onEdit(row.original)}
          type="button"
        >
          {String(row.original.name)}
        </button>
      ),
      header: "Name"
    },
    {
      accessorKey: "startDate",
      header: "Start date",
      cell: ({ row }) => formatDate(row.original.startDate)
    },
    {
      accessorKey: "endDate",
      header: "End date",
      cell: ({ row }) => formatDate(row.original.endDate)
    },
    {
      accessorKey: "isActive",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.isActive ? "Active" : "Inactive"}
          tone={row.original.isActive ? "success" : "neutral"}
        />
      ),
      header: "Status"
    },
    {
      cell: ({ row }) => (
        <div
          className="flex w-full justify-center"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <WorkspaceRowActions
            actions={[
              {
                id: "force-delete",
                icon: <Trash2 className="size-4" />,
                label: "Force delete",
                onSelect: () => onForceDelete(row.original),
                tone: "destructive"
              }
            ]}
            deleteLabel="Suspend"
            isSuspended={!row.original.isActive}
            onDelete={() => onSuspend(row.original)}
            onEdit={() => onEdit(row.original)}
            onRestore={() => onRestore(row.original)}
            title={String(row.original.name)}
          />
        </div>
      ),
      enableSorting: false,
      header: () => <div className="text-center">Actions</div>,
      id: "actions",
      size: 96
    }
  ];
  return (
    <WorkspaceTable
      columns={columns.filter(
        (column) =>
          !listTools?.hidden.includes(
            "accessorKey" in column ? String(column.accessorKey) : (column.id ?? "")
          )
      )}
      {...(listTools?.showFilters ? { filterRow: listTools.filterRow } : {})}
      data={records}
      emptyState="No months found."
      isLoading={loading}
      minWidth="760px"
    />
  );
}
