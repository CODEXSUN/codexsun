"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Check, Eye, GraduationCap, Pencil, Trash2, X } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { MasterColumnFilters, MasterRecord } from "./master.types";

export function MasterList({
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
  records: MasterRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  showInlineFilters?: boolean;
  columnFilters?: MasterColumnFilters;
  onColumnFilterChange?: (column: string, value: string) => void;
  onView: (record: MasterRecord) => void;
  onEdit: (record: MasterRecord) => void;
  onDelete?: (record: MasterRecord) => void;
}) {
  const columns: ColumnDef<MasterRecord>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: () => (
        <div>
          <span>MASTER / INSTRUCTOR</span>
          {showInlineFilters ? (
            <Input
              value={columnFilters.name ?? ""}
              onChange={(e) => onColumnFilterChange?.("name", e.target.value)}
              placeholder="Filter master..."
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
          <div className="text-xs text-muted-foreground">{row.original.title}</div>
        </div>
      )
    },
    {
      id: "primaryDiscipline",
      accessorKey: "primaryDiscipline",
      header: () => (
        <div>
          <span>DISCIPLINE</span>
          {showInlineFilters ? (
            <Input
              value={columnFilters.primaryDiscipline ?? ""}
              onChange={(e) => onColumnFilterChange?.("primaryDiscipline", e.target.value)}
              placeholder="Filter discipline..."
              className="mt-1 h-6 text-[11px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
        </div>
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
          <GraduationCap className="size-3.5 text-emerald-600" />
          <span>{row.original.primaryDiscipline}</span>
        </span>
      )
    },
    {
      id: "contact",
      header: () => <span>CONTACT</span>,
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="text-foreground">{row.original.email}</div>
          <div className="font-mono text-muted-foreground">{row.original.phone || "—"}</div>
        </div>
      )
    },
    {
      id: "experienceYears",
      accessorKey: "experienceYears",
      header: () => <span>EXPERIENCE</span>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.experienceYears} yrs</span>
      )
    },
    {
      id: "isApprovedPublic",
      accessorKey: "isApprovedPublic",
      header: () => <span>SHOWCASE</span>,
      cell: ({ row }) =>
        row.original.isApprovedPublic ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3.5" />
            <span>Public</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <X className="size-3.5" />
            <span>Private</span>
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
            title="Edit Master"
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
              title="Delete Master"
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
          No masters or coaches registered in this directory.
        </div>
      }
    />
  );
}
