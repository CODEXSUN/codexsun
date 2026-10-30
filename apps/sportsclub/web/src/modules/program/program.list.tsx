"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Check, Eye, Pencil, Trash2, X } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { ProgramColumnFilters, ProgramRecord } from "./program.types";

export function ProgramList({
  records,
  isLoading,
  visibleColumns = {},
  showInlineFilters = false,
  columnFilters = {},
  onColumnFilterChange,
  onView,
  onEdit,
  onDelete
}: {
  records: ProgramRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  showInlineFilters?: boolean;
  columnFilters?: ProgramColumnFilters;
  onColumnFilterChange?: (column: string, value: string) => void;
  onView: (record: ProgramRecord) => void;
  onEdit: (record: ProgramRecord) => void;
  onDelete?: (record: ProgramRecord) => void;
}) {
  const columns: ColumnDef<ProgramRecord>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: () => (
        <div>
          <span>CODE</span>
          {showInlineFilters ? (
            <Input
              value={columnFilters.code ?? ""}
              onChange={(e) => onColumnFilterChange?.("code", e.target.value)}
              placeholder="Filter code..."
              className="mt-1 h-6 text-[11px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.original.code}
        </span>
      )
    },
    {
      id: "name",
      accessorKey: "name",
      header: () => (
        <div>
          <span>PROGRAM / CURRICULUM</span>
          {showInlineFilters ? (
            <Input
              value={columnFilters.name ?? ""}
              onChange={(e) => onColumnFilterChange?.("name", e.target.value)}
              placeholder="Filter name..."
              className="mt-1 h-6 text-[11px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
        </div>
      ),
      cell: ({ row }) => (
        <div>
          <button
            type="button"
            className="cursor-pointer font-medium text-foreground hover:underline text-left"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
          >
            {row.original.name}
          </button>
          <div className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.description || "—"}
          </div>
        </div>
      )
    },
    {
      id: "discipline",
      accessorKey: "discipline",
      header: () => (
        <div>
          <span>DISCIPLINE</span>
          {showInlineFilters ? (
            <Input
              value={columnFilters.discipline ?? ""}
              onChange={(e) => onColumnFilterChange?.("discipline", e.target.value)}
              placeholder="Filter discipline..."
              className="mt-1 h-6 text-[11px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-medium text-foreground">{row.original.discipline}</span>
      )
    },
    {
      id: "level",
      accessorKey: "level",
      header: () => <span>LEVEL</span>,
      cell: ({ row }) => (
        <span className="capitalize text-xs text-muted-foreground">
          {row.original.level.replace("_", " ")}
        </span>
      )
    },
    {
      id: "ageGroup",
      accessorKey: "ageGroup",
      header: () => <span>AGE GROUP</span>,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.ageGroup}</span>
    },
    {
      id: "isApprovedPublic",
      accessorKey: "isApprovedPublic",
      header: () => <span>PUBLIC</span>,
      cell: ({ row }) =>
        row.original.isApprovedPublic ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3.5" />
            <span>Showcase</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <X className="size-3.5" />
            <span>Hidden</span>
          </span>
        )
    },
    {
      id: "status",
      accessorKey: "status",
      header: () => <span>STATUS</span>,
      cell: ({ row }) => <WorkspaceStatusBadge status={row.original.status} />
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="View Details"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
          >
            <Eye className="size-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Edit Program"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
          >
            <Pencil className="size-3.5" />
          </button>
          {onDelete ? (
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete Program"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original);
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      )
    }
  ];

  const filteredColumns = columns.filter((col) => {
    if (!col.id) return true;
    return visibleColumns[col.id] !== false;
  });

  return (
    <WorkspaceTable
      columns={filteredColumns}
      data={records}
      isLoading={isLoading}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">
          No training programs found in this category.
        </div>
      }
    />
  );
}
