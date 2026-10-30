import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { RotateCcw, Trash2 } from "lucide-react";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import type { AttendanceRecord } from "./attendance.types";

export const attendanceListColumns = {"employeeCode": "Employee code", "employeeName": "Employee", "department": "Department", "workDate": "Date", "status": "Status", "checkIn": "Check in", "checkOut": "Check out"};

type AttendanceListProps = {
  listTools?: WorkspaceListTools;
  records: AttendanceRecord[];
  loading: boolean;
  onEdit: (record: AttendanceRecord) => void;
  onRestore: (record: AttendanceRecord) => void;
  onRemove: (record: AttendanceRecord) => void;
};

export function AttendanceList({
  listTools,
  records,
  loading,
  onEdit,
  onRestore,
  onRemove
}: AttendanceListProps) {
  const columns: ColumnDef<AttendanceRecord>[] = [
        { accessorKey: "employeeCode", header: "Employee code" },
        { accessorKey: "employeeName", header: "Employee" },
        { accessorKey: "department", header: "Department" },
        { accessorKey: "workDate", header: "Date" },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <WorkspaceStatusBadge
              label={row.original.status[0]!.toUpperCase() + row.original.status.slice(1)}
              tone={
                row.original.status === "present"
                  ? "success"
                  : row.original.status === "absent"
                    ? "danger"
                    : row.original.status === "leave"
                      ? "warning"
                      : "info"
              }
            />
          )
        },
        {
          accessorKey: "checkIn",
          header: "Check in",
          cell: ({ row }) => row.original.checkIn || "—"
        },
        {
          accessorKey: "checkOut",
          header: "Check out",
          cell: ({ row }) => row.original.checkOut || "—"
        },
        {
          id: "actions",
          header: "Action",
          cell: ({ row }) => (
            <WorkspaceRowActions
              title={`${row.original.employeeCode} attendance`}
              onView={() => onEdit(row.original)}
              onEdit={() => onEdit(row.original)}
              actions={
                row.original.deletedAt
                  ? [
                      {
                        id: "restore",
                        label: "Restore",
                        icon: <RotateCcw />,
                        onSelect: () => onRestore(row.original)
                      }
                    ]
                  : [
                      {
                        id: "remove",
                        label: "Remove",
                        icon: <Trash2 />,
                        tone: "destructive",
                        onSelect: () => onRemove(row.original)
                      }
                    ]
              }
            />
          )
        }
      ];

  return (
    <WorkspaceTable
      data={records}
      isLoading={loading}
      emptyState="No attendance records for this date."
      minWidth="900px"
      columns={columns.filter((column) => !listTools?.hidden.includes(String(column.id ?? ("accessorKey" in column ? column.accessorKey : ""))))}
      {...(listTools?.showFilters ? {filterRow:listTools.filterRow} : {})}
    />
  );
}
