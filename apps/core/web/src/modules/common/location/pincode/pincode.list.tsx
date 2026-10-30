import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Trash2 } from "lucide-react";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { PincodeRecord } from "./pincode.types";
export const pincodeListColumns = {
  name: "Pincode",
  area: "Area",
  cityName: "City",
  districtName: "District",
  stateName: "State",
  countryName: "Country",
  status: "Status"
};

export function PincodeList({
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
  onEdit: (r: PincodeRecord) => void;
  onForceDelete: (r: PincodeRecord) => void;
  onRestore: (r: PincodeRecord) => void;
  onSuspend: (r: PincodeRecord) => void;
  records: PincodeRecord[];
}) {
  const columns: ColumnDef<PincodeRecord>[] = [
    {
      accessorKey: "sortOrder",
      cell: ({ row }) => <div className="text-center tabular-nums">{row.original.sortOrder}</div>,
      header: () => <div className="text-center">#</div>,
      size: 64
    },
    {
      accessorKey: "name",
      cell: ({ row }) =>
        isProtectedPincode(row.original) ? (
          <span className="font-medium">{row.original.name}</span>
        ) : (
          <button
            className="cursor-pointer font-medium text-foreground hover:underline"
            onClick={() => onEdit(row.original)}
            type="button"
          >
            {row.original.name}
          </button>
        ),
      header: "Pincode"
    },
    { accessorKey: "area", header: "Area" },
    { accessorKey: "cityName", header: "City" },
    { accessorKey: "districtName", header: "District" },
    { accessorKey: "stateName", header: "State" },
    { accessorKey: "countryName", header: "Country" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.status === "active" ? "Active" : "Inactive"}
          tone={row.original.status === "active" ? "success" : "neutral"}
        />
      )
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      size: 96,
      enableSorting: false,
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div
            className="flex w-full justify-center"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {isProtectedPincode(record) ? (
              <WorkspaceProtectedIndicator label="Protected pincode" />
            ) : (
              <WorkspaceRowActions
                actions={[
                  {
                    id: "force-delete",
                    icon: <Trash2 className="size-4" />,
                    label: "Force delete",
                    onSelect: () => onForceDelete(record),
                    tone: "destructive"
                  }
                ]}
                deleteLabel="Suspend"
                isSuspended={record.status === "inactive"}
                onDelete={() => onSuspend(record)}
                onEdit={() => onEdit(record)}
                onRestore={() => onRestore(record)}
                title={record.name}
              />
            )}
          </div>
        );
      }
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
      emptyState="No pincodes found."
      isLoading={loading}
      minWidth="860px"
    />
  );
}
export function isProtectedPincode(record: PincodeRecord) {
  return record.name.trim() === "-";
}
