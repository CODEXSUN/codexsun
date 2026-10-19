"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Eye, Pencil, ShieldAlert, UserCheck } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { MemberColumnFilters, MemberRecord } from "./member.types";

export function MemberList({
  records,
  isLoading,
  visibleColumns = {},
  showInlineFilters = false,
  columnFilters = {},
  onColumnFilterChange,
  onView,
  onEdit,
  onToggleStatus
}: {
  records: MemberRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  showInlineFilters?: boolean;
  columnFilters?: MemberColumnFilters;
  onColumnFilterChange?: (column: string, value: string) => void;
  onView: (record: MemberRecord) => void;
  onEdit: (record: MemberRecord) => void;
  onToggleStatus?: (record: MemberRecord) => void;
}) {
  const columns: ColumnDef<MemberRecord>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: () => (
        <div>
          <span>MEMBER / STUDENT</span>
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
          <div className="text-[11px] text-muted-foreground capitalize">
            {row.original.role}
            {row.original.gender ? ` • ${row.original.gender}` : ""}
          </div>
        </div>
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
      id: "guardian",
      header: () => <span>GUARDIAN & EMERGENCY</span>,
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="text-foreground">{row.original.guardianName || "—"}</div>
          <div className="font-mono text-muted-foreground">
            {row.original.guardianPhone || row.original.emergencyContact || "—"}
          </div>
        </div>
      )
    },
    {
      id: "program",
      header: () => <span>CURRICULUM</span>,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {row.original.programName || (row.original.programUuid ? row.original.programUuid.slice(0, 8) : "—")}
        </span>
      )
    },
    {
      id: "master",
      header: () => <span>ASSIGNED ASAN</span>,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {row.original.masterName || (row.original.masterUuid ? row.original.masterUuid.slice(0, 8) : "—")}
        </span>
      )
    },
    {
      id: "status",
      accessorKey: "status",
      header: () => <span>STATUS</span>,
      cell: ({ row }) => <WorkspaceStatusBadge status={row.original.status ?? "pending"} />
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const item = row.original;
        const isSuspended = item.status === "suspended";
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="View Details"
              onClick={(e) => {
                e.stopPropagation();
                onView(item);
              }}
            >
              <Eye className="size-3.5" />
            </button>
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Edit Member"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
            >
              <Pencil className="size-3.5" />
            </button>
            {onToggleStatus ? (
              <button
                type="button"
                className={`rounded p-1 ${
                  isSuspended
                    ? "text-emerald-600 hover:bg-emerald-500/10"
                    : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                }`}
                title={isSuspended ? "Activate Member" : "Suspend Member"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(item);
                }}
              >
                {isSuspended ? (
                  <UserCheck className="size-3.5" />
                ) : (
                  <ShieldAlert className="size-3.5" />
                )}
              </button>
            ) : null}
          </div>
        );
      }
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
          No members found matching your search or filters.
        </div>
      }
    />
  );
}
