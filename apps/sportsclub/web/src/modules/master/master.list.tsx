"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Check, X } from "lucide-react";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { MasterRecord } from "./master.types";

export function MasterList({
  records,
  isLoading,
  onView,
  onEdit,
  onSuspend,
  onRestore
}: {
  records: MasterRecord[];
  isLoading: boolean;
  onView: (record: MasterRecord) => void;
  onEdit: (record: MasterRecord) => void;
  onSuspend?: (record: MasterRecord) => void;
  onRestore?: (record: MasterRecord) => void;
}) {
  const columns: ColumnDef<MasterRecord>[] = [
    {
      id: "fullName",
      accessorKey: "fullName",
      header: "Master / Asan Name",
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
            {row.original.fullName}
          </button>
          <div className="text-xs text-muted-foreground">{row.original.title}</div>
        </div>
      )
    },
    {
      id: "specialization",
      accessorKey: "specialization",
      header: "Specialization",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/30 px-2 py-0.5 text-xs font-medium">
          {row.original.specialization}
        </span>
      )
    },
    {
      id: "experienceYears",
      accessorKey: "experienceYears",
      header: "Experience",
      cell: ({ row }) =>
        row.original.experienceYears ? (
          <span>{row.original.experienceYears} yrs</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      id: "phone",
      header: "Contact",
      cell: ({ row }) => (
        <div className="text-xs font-mono">
          <div>{row.original.phone ?? "—"}</div>
          {row.original.email ? (
            <div className="font-sans text-muted-foreground">{row.original.email}</div>
          ) : null}
        </div>
      )
    },
    {
      id: "isApprovedPublic",
      accessorKey: "isApprovedPublic",
      header: "Public Profile",
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
        const tone = status === "active" ? "success" : "danger";
        const label = status === "active" ? "Active" : "Inactive";
        return <WorkspaceStatusBadge label={label} tone={tone} />;
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        const isSuspended = item.status === "inactive";
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <WorkspaceRowActions
              title="Master"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              isSuspended={isSuspended}
              deleteLabel="Deactivate Asan"
              restoreLabel="Activate Asan"
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
      columns={columns}
      data={records}
      isLoading={isLoading}
      onRowClick={onView}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">
          No masters / instructors registered yet. Add your club asans.
        </div>
      }
    />
  );
}
