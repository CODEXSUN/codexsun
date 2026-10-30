"use client";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { ProgressRecord } from "./progress.types";
export function ProgressList({
  records,
  isLoading,
  visibleColumns = {},
  filterRow,
  onView,
  onEdit
}: {
  records: ProgressRecord[];
  isLoading: boolean;
  visibleColumns?: Record<string, boolean>;
  filterRow?: ((columnId: string) => React.ReactNode) | undefined;
  onView: (record: ProgressRecord) => void;
  onEdit: (record: ProgressRecord) => void;
}) {
  const columns: ColumnDef<ProgressRecord>[] = [
    {
      id: "memberUuid",
      accessorKey: "memberUuid",
      header: "Student ID",
      cell: ({ row }) => <span className="text-foreground">{row.original.memberUuid || "—"}</span>
    },
    {
      id: "masterUuid",
      accessorKey: "masterUuid",
      header: "Master ID",
      cell: ({ row }) => <span className="text-foreground">{row.original.masterUuid || "—"}</span>
    },
    {
      id: "stageLevel",
      accessorKey: "stageLevel",
      header: "Stage",
      cell: ({ row }) => <span className="text-foreground">{row.original.stageLevel || "—"}</span>
    },
    {
      id: "score",
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => row.original.score ?? "—"
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <span className="text-foreground">{row.original.status || "—"}</span>
    },
    {
      id: "gradedAt",
      accessorKey: "gradedAt",
      header: "Graded at",
      cell: ({ row }) => <span className="text-foreground">{row.original.gradedAt || "—"}</span>
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <WorkspaceRowActions
            title="Progress"
            onView={() => onView(row.original)}
            onEdit={() => onEdit(row.original)}
          />
        </div>
      )
    }
  ];
  return (
    <WorkspaceTable
      columns={columns.filter(
        (column) => column.id === "actions" || visibleColumns[String(column.id)] !== false
      )}
      data={records}
      isLoading={isLoading}
      onRowClick={onView}
      {...(filterRow ? { filterRow } : {})}
      emptyState={
        <div className="p-8 text-center text-sm text-muted-foreground">No records found.</div>
      }
    />
  );
}
