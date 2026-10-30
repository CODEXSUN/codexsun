"use client";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { AttendanceRecord } from "./attendance.types";
export function AttendanceList({
  records,
  isLoading,
  visibleColumns = {},
  filterRow,
  onView,
  onEdit,
  onDelete
}: {
  records: AttendanceRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  filterRow?: ((columnId: string) => React.ReactNode) | undefined;
  onView: (record: AttendanceRecord) => void;
  onEdit: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void;
}) {
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      id: "attendanceDate",
      accessorKey: "attendanceDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.attendanceDate || "—"}</span>
      )
    },
    {
      id: "memberUuid",
      accessorKey: "memberUuid",
      header: "Student ID",
      cell: ({ row }) => <span className="text-foreground">{row.original.memberUuid || "—"}</span>
    },
    {
      id: "sessionUuid",
      accessorKey: "sessionUuid",
      header: "Session ID",
      cell: ({ row }) => <span className="text-foreground">{row.original.sessionUuid || "—"}</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <span className="text-foreground">{row.original.status || "—"}</span>
    },
    {
      id: "remarks",
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => <span className="text-foreground">{row.original.remarks || "—"}</span>
    },
    {
      id: "recordedBy",
      accessorKey: "recordedBy",
      header: "Recorded by",
      cell: ({ row }) => <span className="text-foreground">{row.original.recordedBy || "—"}</span>
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <WorkspaceRowActions
            title="Attendance"
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
