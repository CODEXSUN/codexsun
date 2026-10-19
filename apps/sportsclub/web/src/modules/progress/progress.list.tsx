"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Award } from "lucide-react";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { ProgressRecord } from "./progress.types";

export function ProgressList({
  records,
  isLoading,
  onView,
  onEdit
}: {
  records: ProgressRecord[];
  isLoading: boolean;
  onView: (record: ProgressRecord) => void;
  onEdit: (record: ProgressRecord) => void;
}) {
  const columns: ColumnDef<ProgressRecord>[] = [
    {
      id: "assessmentDate",
      accessorKey: "assessmentDate",
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
          {row.original.assessmentDate}
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
      id: "stageLevel",
      accessorKey: "stageLevel",
      header: "Stage / Belt Level",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
          <Award className="size-3 text-amber-500" />
          {row.original.stageLevel}
        </span>
      )
    },
    {
      id: "masterName",
      accessorKey: "masterName",
      header: "Evaluating Asan",
      cell: ({ row }) => row.original.masterName ?? <span className="text-muted-foreground">—</span>
    },
    {
      id: "certificateNo",
      accessorKey: "certificateNo",
      header: "Certificate",
      cell: ({ row }) =>
        row.original.certificateNo ? (
          <span className="font-mono text-xs text-foreground">{row.original.certificateNo}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Result",
      cell: ({ row }) => {
        const status = row.original.status;
        const tone =
          status === "passed"
            ? "success"
            : status === "in_progress"
              ? "info"
              : status === "eligible"
                ? "warning"
                : "danger";
        const label =
          status === "passed"
            ? "Passed"
            : status === "in_progress"
              ? "In Progress"
              : status === "eligible"
                ? "Eligible"
                : "Retry Needed";
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
              title="Assessment"
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
          No grading assessments recorded yet. Record student belt examinations.
        </div>
      }
    />
  );
}
