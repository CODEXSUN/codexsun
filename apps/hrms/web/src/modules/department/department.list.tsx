import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { RotateCcw, Trash2 } from "lucide-react";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { DepartmentRecord } from "./department.types";

export type DepartmentAction = "activate" | "deactivate" | "remove" | "restore" | "forceDelete";

export const departmentListColumns = {"name": "Department name", "description": "Description", "status": "Status"};

export function DepartmentList({
  listTools,
  entries,
  loading,
  onView,
  onEdit,
  onAction
}: {
  listTools?: WorkspaceListTools;
  entries: DepartmentRecord[];
  loading: boolean;
  onView: (department: DepartmentRecord) => void;
  onEdit: (department: DepartmentRecord) => void;
  onAction: (department: DepartmentRecord, action: DepartmentAction) => void;
}) {
  const columns: ColumnDef<DepartmentRecord>[] = [
    {
      accessorKey: "name",
      header: "Department name",
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
        const department = row.original;
        const actions = department.deletedAt
          ? [
              {
                id: "restore",
                label: "Restore department",
                icon: <RotateCcw />,
                onSelect: () => onAction(department, "restore")
              },
              {
                id: "force",
                label: "Force delete",
                icon: <Trash2 />,
                tone: "destructive" as const,
                onSelect: () => onAction(department, "forceDelete")
              }
            ]
          : [
              {
                id: "status",
                label: department.status === "active" ? "Deactivate" : "Activate",
                onSelect: () =>
                  onAction(department, department.status === "active" ? "deactivate" : "activate")
              },
              {
                id: "remove",
                label: "Delete",
                icon: <Trash2 />,
                tone: "destructive" as const,
                onSelect: () => onAction(department, "remove")
              }
            ];
        return (
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <WorkspaceRowActions
              title={department.name}
              onView={() => onView(department)}
              {...(!department.deletedAt ? { onEdit: () => onEdit(department) } : {})}
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
      emptyState="No departments found."
      minWidth="760px"
    />
  );
}
