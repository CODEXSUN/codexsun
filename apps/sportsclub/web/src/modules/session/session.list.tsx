"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Clock, MapPin } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { SessionRecord } from "./session.types";

export function SessionList({
  records,
  isLoading,
  visibleColumns = {},
  showInlineFilters = false,
  columnFilters = {},
  onColumnFilterChange,
  onView,
  onEdit,
  onSuspend,
  onRestore
}: {
  records: SessionRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  showInlineFilters?: boolean;
  columnFilters?: Record<string, string | undefined>;
  onColumnFilterChange?: (column: string, value: string) => void;
  onView: (record: SessionRecord) => void;
  onEdit: (record: SessionRecord) => void;
  onSuspend?: (record: SessionRecord) => void;
  onRestore?: (record: SessionRecord) => void;
}) {
  const columns: ColumnDef<SessionRecord>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: () => <div>Batch / Session{showInlineFilters ? <Input aria-label="Filter title" className="mt-1 h-6" value={columnFilters.title ?? ""} onChange={(event) => onColumnFilterChange?.("title", event.target.value)} /> : null}</div>,
      cell: ({ row }) => (
        <div>
          <button
            type="button"
            className="cursor-pointer font-medium text-foreground hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
          >
            {row.original.title}
          </button>
          <div className="text-xs text-muted-foreground">{row.original.programTitle ?? "General"}</div>
        </div>
      )
    },
    {
      id: "masterName",
      accessorKey: "masterName",
      header: "Instructor / ஆசான்",
      cell: ({ row }) => row.original.masterName ?? <span className="text-muted-foreground">—</span>
    },
    {
      id: "schedule",
      header: () => <div>Days & Time{showInlineFilters ? <Input aria-label="Filter days" className="mt-1 h-6" value={columnFilters.daysOfWeek ?? ""} onChange={(event) => onColumnFilterChange?.("daysOfWeek", event.target.value)} /> : null}</div>,
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">{row.original.daysOfWeek}</div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3" />
            <span>
              {row.original.startTime} – {row.original.endTime}
            </span>
          </div>
        </div>
      )
    },
    {
      id: "venue",
      accessorKey: "venue",
      header: () => <div>Venue{showInlineFilters ? <Input aria-label="Filter venue" className="mt-1 h-6" value={columnFilters.venue ?? ""} onChange={(event) => onColumnFilterChange?.("venue", event.target.value)} /> : null}</div>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span>{row.original.venue}</span>
        </div>
      )
    },
    {
      id: "capacity",
      header: "Capacity",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.enrolledStudentsCount ?? 0} / {row.original.maxCapacity} Max
        </span>
      )
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const tone = status === "active" ? "success" : "danger";
        const label = status === "active" ? "Active" : "Cancelled";
        return <WorkspaceStatusBadge label={label} tone={tone} />;
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        const isSuspended = item.status === "cancelled";
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <WorkspaceRowActions
              title="Session"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              isSuspended={isSuspended}
              deleteLabel="Deactivate Batch"
              restoreLabel="Activate Batch"
              {...(onSuspend && !isSuspended ? { onDelete: () => onSuspend(item) } : {})}
              {...(onRestore && isSuspended ? { onRestore: () => onRestore(item) } : {})}
            />
          </div>
        );
      }
    }
  ];

  return (
    <WorkspaceTable
      columns={columns.filter((column) => column.id === "actions" || visibleColumns[column.id ?? ""] !== false)}
      data={records}
      isLoading={isLoading}
      onRowClick={onView}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">
          No training batches or sessions created yet. Schedule your first class.
        </div>
      }
    />
  );
}
