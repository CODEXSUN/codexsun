import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { Trash2 } from "lucide-react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { BrandsRecord } from "./brands.types";

export const brandsListColumns = {
  name: "Brand",
  showOnStorefront: "Storefront",
  isActive: "Status"
};

export function BrandsList({
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
  onEdit: (record: BrandsRecord) => void;
  onForceDelete: (record: BrandsRecord) => void;
  onRestore: (record: BrandsRecord) => void;
  onSuspend: (record: BrandsRecord) => void;
  records: BrandsRecord[];
}) {
  const columns: ColumnDef<BrandsRecord>[] = [
    {
      accessorKey: "sortOrder",
      cell: ({ row }) => <div className="text-center tabular-nums">{row.original.sortOrder}</div>,
      header: () => <div className="text-center">#</div>,
      size: 64
    },
    {
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-white p-1.5">
            {row.original.logoUrl ? (
              <img
                className="max-h-full max-w-full object-contain"
                src={row.original.logoUrl}
                alt={row.original.logoAlt}
              />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {row.original.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <button
            className="cursor-pointer font-medium text-foreground hover:underline"
            onClick={() => onEdit(row.original)}
            type="button"
          >
            {String(row.original.name)}
          </button>
        </div>
      ),
      header: "Brand"
    },
    {
      accessorKey: "showOnStorefront",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.showOnStorefront ? "Visible" : "Hidden"}
          tone={row.original.showOnStorefront ? "info" : "neutral"}
        />
      ),
      header: "Storefront"
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
      emptyState="No brands found."
      isLoading={loading}
      minWidth="760px"
    />
  );
}
