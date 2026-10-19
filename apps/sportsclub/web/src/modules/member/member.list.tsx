"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { MemberRecord } from "./member.types";

export function MemberList({
  records,
  isLoading,
  onView,
  onEdit,
  onSuspend,
  onRestore
}: {
  records: MemberRecord[];
  isLoading: boolean;
  onView: (record: MemberRecord) => void;
  onEdit: (record: MemberRecord) => void;
  onSuspend?: (record: MemberRecord) => void;
  onRestore?: (record: MemberRecord) => void;
}) {
  const columns: ColumnDef<MemberRecord>[] = [
    {
      id: "memberNo",
      accessorKey: "memberNo",
      header: "Member ID",
      cell: ({ row }) => (
        <button
          type="button"
          className="cursor-pointer font-medium text-foreground hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onView(row.original);
          }}
        >
          {row.original.memberNo}
        </button>
      )
    },
    {
      id: "fullName",
      accessorKey: "fullName",
      header: "Student Name",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-foreground">{row.original.fullName}</span>
          {row.original.guardianName ? (
            <div className="text-xs text-muted-foreground">
              Guardian: {row.original.guardianName} ({row.original.guardianRelation ?? "Guardian"})
            </div>
          ) : null}
        </div>
      )
    },
    {
      id: "currentLevel",
      accessorKey: "currentLevel",
      header: "Level / Belt",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/30 px-2 py-0.5 text-xs font-medium">
          {row.original.currentLevel}
        </span>
      )
    },
    {
      id: "masterName",
      accessorKey: "masterName",
      header: "Assigned Asan",
      cell: ({ row }) => row.original.masterName ?? <span className="text-muted-foreground">—</span>
    },
    {
      id: "guardianPhone",
      header: "Contact / Emergency",
      cell: ({ row }) => {
        const phone = row.original.guardianPhone ?? row.original.emergencyContact;
        return phone ? (
          <span className="font-mono text-xs">{phone}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const tone =
          status === "active" ? "success" : status === "pending" ? "warning" : "danger";
        const label =
          status === "active" ? "Active" : status === "pending" ? "Pending Approval" : "Suspended";
        return <WorkspaceStatusBadge label={label} tone={tone} />;
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        const isSuspended = item.status === "suspended";
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <WorkspaceRowActions
              title="Member"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              isSuspended={isSuspended}
              deleteLabel="Suspend Student"
              restoreLabel="Restore Student"
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
          No students registered yet. Select Add Student to enroll a new member.
        </div>
      }
    />
  );
}
