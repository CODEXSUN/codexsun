"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { AttendanceRecord } from "./attendance.types";

export function AttendanceList({
  records,
  isLoading,
  onView,
  onEdit,
  onDelete
}: {
  records: AttendanceRecord[];
  isLoading: boolean;
  onView: (record: AttendanceRecord) => void;
  onEdit: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void;
}) {
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      id: "sessionDate",
      accessorKey: "sessionDate",
      header: "Date",
      cell: ({ row }) => (
        <button
          type="button"
          className="cursor-pointer font-medium text-foreground hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onView(row.original);
          }}
        >
          {row.original.sessionDate}
        </button>
      )
    },
    {
      id: "studentName",
      accessorKey: "studentName",
      header: "Student",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-foreground">{row.original.studentName ?? "—"}</span>
          {row.original.studentMemberNo ? (
            <div className="font-mono text-xs text-muted-foreground">
              #{row.original.studentMemberNo}
            </div>
          ) : null}
        </div>
      )
    },
    {
      id: "sessionTitle",
      accessorKey: "sessionTitle",
      header: "Session / Batch",
      cell: ({ row }) => row.original.sessionTitle ?? <span className="text-muted-foreground">—</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const tone =
          status === "present"
            ? "success"
            : status === "late"
              ? "warning"
              : status === "excused"
                ? "info"
                : "danger";
        const label =
          status === "present"
            ? "Present"
            : status === "absent"
              ? "Absent"
              : status === "late"
                ? "Late"
                : "Excused";
        return <WorkspaceStatusBadge label={label} tone={tone} />;
      }
    },
    {
      id: "notes",
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) =>
        row.original.notes ? (
          <span className="text-xs text-muted-foreground">{row.original.notes}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <WorkspaceRowActions
              title="Attendance"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              deleteLabel="Delete Entry"
              {...(onDelete ? { onDelete: () => onDelete(item) } : {})}
            />
          </div>
        );
      }
    }
  ];

  return (
    <WorkspaceTable
      columns={columns}
      data={records}
      isLoading={isLoading}
      onRowClick={onView}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">
          No attendance recorded for this filter. Mark today's class attendance.
        </div>
      }
    />
  );
}
