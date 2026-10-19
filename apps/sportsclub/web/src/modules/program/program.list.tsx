"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Check, X } from "lucide-react";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { ProgramRecord } from "./program.types";

export function ProgramList({
  records,
  isLoading,
  onView,
  onEdit,
  onSuspend,
  onRestore
}: {
  records: ProgramRecord[];
  isLoading: boolean;
  onView: (record: ProgramRecord) => void;
  onEdit: (record: ProgramRecord) => void;
  onSuspend?: (record: ProgramRecord) => void;
  onRestore?: (record: ProgramRecord) => void;
}) {
  const columns: ColumnDef<ProgramRecord>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Program / Discipline",
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
          <div className="font-mono text-xs text-muted-foreground">/{row.original.slug}</div>
        </div>
      )
    },
    {
      id: "category",
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="capitalize font-medium text-foreground">
          {row.original.category}
        </span>
      )
    },
    {
      id: "skillLevels",
      accessorKey: "skillLevels",
      header: "Grading Levels",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.skillLevels}</span>
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
            <X className="size-3.5" /> Hidden
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
              title="Program"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              isSuspended={isSuspended}
              deleteLabel="Deactivate Program"
              restoreLabel="Activate Program"
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
          No training disciplines defined yet. Add your sports & martial arts programs.
        </div>
      }
    />
  );
}
