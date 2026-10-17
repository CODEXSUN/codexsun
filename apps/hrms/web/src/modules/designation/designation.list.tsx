import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { RotateCcw, Trash2 } from "lucide-react";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { DesignationRecord } from "./designation.types";

export type DesignationAction = "activate" | "deactivate" | "remove" | "restore" | "forceDelete";

export const designationListColumns = {"name": "Designation name", "description": "Description", "status": "Status"};

export function DesignationList({
  listTools,
  entries,
  loading,
  onView,
  onEdit,
  onAction
}: {
  listTools?: WorkspaceListTools;
  entries: DesignationRecord[];
  loading: boolean;
  onView: (designation: DesignationRecord) => void;
  onEdit: (designation: DesignationRecord) => void;
  onAction: (designation: DesignationRecord, action: DesignationAction) => void;
}) {
  const columns: ColumnDef<DesignationRecord>[] = [
    {
      accessorKey: "name",
      header: "Designation name",
      cell: ({ row }) => (
        <button
          className="cursor-pointer font-medium text-foreground hover:underline"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView(row.original);
          }}
        >
          {row.original.name}
        </button>
      )
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "—"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={
            row.original.deletedAt
              ? "Deleted"
              : row.original.status === "active"
                ? "Active"
                : "Inactive"
          }
          tone={
            row.original.deletedAt
              ? "neutral"
              : row.original.status === "active"
                ? "success"
                : "danger"
          }
        />
      )
    },
    {
      id: "actions",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => {
        const designation = row.original;
        const actions = designation.deletedAt
          ? [
              {
                id: "restore",
                label: "Restore designation",
                icon: <RotateCcw />,
                onSelect: () => onAction(designation, "restore")
              },
              {
                id: "force",
                label: "Force delete",
                icon: <Trash2 />,
                tone: "destructive" as const,
                onSelect: () => onAction(designation, "forceDelete")
              }
            ]
          : [
              {
                id: "status",
                label: designation.status === "active" ? "Deactivate" : "Activate",
                onSelect: () =>
                  onAction(designation, designation.status === "active" ? "deactivate" : "activate")
              },
              {
                id: "remove",
                label: "Delete",
                icon: <Trash2 />,
                tone: "destructive" as const,
                onSelect: () => onAction(designation, "remove")
              }
            ];
        return (
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <WorkspaceRowActions
              title={designation.name}
              onView={() => onView(designation)}
              {...(!designation.deletedAt ? { onEdit: () => onEdit(designation) } : {})}
              actions={actions}
            />
          </div>
        );
      }
    }
  ];

  return (
    <WorkspaceTable
      data={entries}
      columns={columns.filter((column) => !listTools?.hidden.includes(String(column.id ?? ("accessorKey" in column ? column.accessorKey : ""))))}
      {...(listTools?.showFilters ? { filterRow: listTools.filterRow } : {})}
      isLoading={loading}
      emptyState="No designations found."
      minWidth="760px"
    />
  );
}
