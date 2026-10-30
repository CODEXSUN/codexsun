import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Trash2, RotateCcw } from "lucide-react";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceColumnFilter } from "@codexsun/ui/workspace/column-filter";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { formatDate } from "@codexsun/ui/workspace";
import type {
  EmployeeAction,
  EmployeeColumnFilters,
  EmployeeColumnKey,
  EmployeeRecord
} from "./employee.types";

export const employeeColumns: Array<{ id: EmployeeColumnKey; label: string }> = [
  { id: "name", label: "Employee name" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "department", label: "Department" },
  { id: "designation", label: "Designation" },
  { id: "joiningDate", label: "Joining date" },
  { id: "userName", label: "User account" },
  { id: "status", label: "Status" }
];

export function EmployeeList({
  entries,
  loading,
  busy,
  visibleColumns,
  showInlineFilters,
  columnFilters,
  onColumnFilterChange,
  onHideInlineFilters,
  onView,
  onEdit,
  onAction
}: {
  entries: EmployeeRecord[];
  loading: boolean;
  busy: boolean;
  visibleColumns: Record<string, boolean>;
  showInlineFilters: boolean;
  columnFilters: EmployeeColumnFilters;
  onColumnFilterChange: (column: EmployeeColumnKey, value: string) => void;
  onHideInlineFilters: () => void;
  onView: (employee: EmployeeRecord) => void;
  onEdit: (employee: EmployeeRecord) => void;
  onAction: (employee: EmployeeRecord, action: EmployeeAction) => void;
}) {
  const columns: ColumnDef<EmployeeRecord>[] = [
    {
      id: "employeeCode",
      accessorKey: "employeeCode",
      header: "Employee code",
      cell: ({ row }) => (
        <button
          className="cursor-pointer font-medium text-foreground hover:underline"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView(row.original);
          }}
        >
          {row.original.employeeCode}
        </button>
      )
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Employee name",
      cell: ({ row }) => (
        <button
          className="block max-w-80 cursor-pointer truncate text-left font-medium text-foreground hover:underline"
          title={row.original.name}
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
      id: "email",
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "—"
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—"
    },
    {
      id: "department",
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => row.original.department || "—"
    },
    {
      id: "designation",
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => row.original.designation || "—"
    },
    {
      id: "joiningDate",
      accessorKey: "joiningDate",
      header: "Joining date",
      cell: ({ row }) => (row.original.joiningDate ? formatDate(row.original.joiningDate) : "—")
    },
    {
      id: "userName",
      accessorKey: "userName",
      header: "User account",
      cell: ({ row }) => row.original.userName || "Not mapped"
    },
    {
      id: "status",
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
        const employee = row.original;
        return (
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <WorkspaceRowActions
              modal={false}
              title={employee.employeeCode}
              onView={() => onView(employee)}
              {...(!employee.deletedAt && !busy
                ? {
                    onEdit: () => onEdit(employee),
                    onDelete: () => onAction(employee, "status"),
                    onRestore: () => onAction(employee, "status"),
                    isSuspended: employee.status === "inactive"
                  }
                : {})}
              actions={
                busy
                  ? []
                  : employee.deletedAt
                    ? [
                        {
                          id: "restore",
                          label: "Restore employee",
                          icon: <RotateCcw />,
                          onSelect: () => onAction(employee, "restore")
                        },
                        {
                          id: "force",
                          label: "Force delete",
                          icon: <Trash2 />,
                          tone: "destructive",
                          onSelect: () => onAction(employee, "forceDelete")
                        }
                      ]
                    : [
                        {
                          id: "remove",
                          label: "Delete",
                          icon: <Trash2 />,
                          tone: "destructive",
                          onSelect: () => onAction(employee, "remove")
                        }
                      ]
              }
            />
          </div>
        );
      }
    }
  ];
  return (
    <WorkspaceTable
      columns={columns.filter(
        (column) =>
          column.id === "employeeCode" ||
          column.id === "actions" ||
          visibleColumns[column.id ?? ""] !== false
      )}
      data={entries}
      emptyState="No employees found."
      isLoading={loading}
      minWidth="1020px"
      onRowClick={onView}
      {...(showInlineFilters
        ? {
            filterRow: (columnId: string) => {
              const column = employeeColumns.find((item) => item.id === columnId);
              return column ? (
                <WorkspaceColumnFilter
                  label={column.label}
                  value={columnFilters[column.id] ?? ""}
                  onChange={(value) => onColumnFilterChange(column.id, value)}
                  onHide={onHideInlineFilters}
                />
              ) : null;
            }
          }
        : {})}
    />
  );
}
