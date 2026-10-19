"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Phone } from "lucide-react";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { EnquiryRecord } from "./enquiry.types";

export function EnquiryList({
  records,
  isLoading,
  onView,
  onEdit
}: {
  records: EnquiryRecord[];
  isLoading: boolean;
  onView: (record: EnquiryRecord) => void;
  onEdit: (record: EnquiryRecord) => void;
}) {
  const columns: ColumnDef<EnquiryRecord>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Lead / Visitor",
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
            {row.original.name}
          </button>
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Phone className="size-3" />
            <span>{row.original.phone}</span>
          </div>
        </div>
      )
    },
    {
      id: "programOfInterest",
      accessorKey: "programOfInterest",
      header: "Program of Interest",
      cell: ({ row }) =>
        row.original.programOfInterest ? (
          <span className="text-xs font-medium text-foreground">
            {row.original.programOfInterest}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      id: "preferredTiming",
      accessorKey: "preferredTiming",
      header: "Preferred Slot",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.preferredTiming ?? "Any"}
        </span>
      )
    },
    {
      id: "message",
      accessorKey: "message",
      header: "Message Preview",
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
          {row.original.message}
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
          status === "enrolled"
            ? "success"
            : status === "new"
              ? "warning"
              : status === "contacted"
                ? "info"
                : "neutral";
        const label =
          status === "new"
            ? "New Lead"
            : status === "contacted"
              ? "Contacted"
              : status === "enrolled"
                ? "Enrolled"
                : "Closed";
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
              title="Enquiry"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
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
          No inbound enquiries found. All applicant leads are up to date.
        </div>
      }
    />
  );
}
