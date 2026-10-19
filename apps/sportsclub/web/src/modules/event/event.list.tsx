"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Calendar, Check, MapPin, X } from "lucide-react";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { EventRecord } from "./event.types";

export function EventList({
  records,
  isLoading,
  onView,
  onEdit,
  onDelete
}: {
  records: EventRecord[];
  isLoading: boolean;
  onView: (record: EventRecord) => void;
  onEdit: (record: EventRecord) => void;
  onDelete?: (record: EventRecord) => void;
}) {
  const columns: ColumnDef<EventRecord>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Event",
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
          <div className="capitalize text-xs text-muted-foreground">{row.original.eventType}</div>
        </div>
      )
    },
    {
      id: "eventDate",
      accessorKey: "eventDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <Calendar className="size-3.5 text-muted-foreground" />
          <span>{row.original.eventDate}</span>
        </div>
      )
    },
    {
      id: "venue",
      accessorKey: "venue",
      header: "Venue",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span>{row.original.venue}</span>
        </div>
      )
    },
    {
      id: "isApprovedPublic",
      accessorKey: "isApprovedPublic",
      header: "Public Portal",
      cell: ({ row }) =>
        row.original.isApprovedPublic ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Check className="size-3.5" /> Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <X className="size-3.5" /> Internal
          </span>
        )
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const tone =
          status === "completed" ? "success" : status === "upcoming" ? "info" : "danger";
        const label =
          status === "completed" ? "Completed" : status === "upcoming" ? "Upcoming" : "Cancelled";
        return <WorkspaceStatusBadge label={label} tone={tone} />;
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <WorkspaceRowActions
              title="Event"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              deleteLabel="Delete Event"
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
          No club events or tournaments scheduled yet.
        </div>
      }
    />
  );
}
