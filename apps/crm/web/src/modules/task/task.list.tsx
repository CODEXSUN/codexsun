import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace";
import { TaskInlineFilter } from "./task.inline-filter";
import type { TaskColumnFilters, TaskRecord } from "./task.types";

const filters: Record<string, { key: keyof TaskColumnFilters; label: string }> = {
  task: { key: "title", label: "Task" },
  list: { key: "listIn", label: "List in" },
  due: { key: "dueDate", label: "Due date" },
  priority: { key: "priority", label: "Priority" },
  creator: { key: "creator", label: "Creator" },
  assignee: { key: "assignedTo", label: "Assigned to" },
  status: { key: "status", label: "Status" }
};

export function TaskList({
  items,
  loading,
  onOpen,
  onEdit,
  canEdit,
  visibleColumns,
  showInlineFilters,
  columnFilters,
  onColumnFilterChange,
  onHideInlineFilters
}: {
  items: TaskRecord[];
  loading: boolean;
  onOpen: (item: TaskRecord) => void;
  onEdit: (item: TaskRecord) => void;
  canEdit: boolean;
  visibleColumns: Record<string, boolean>;
  showInlineFilters: boolean;
  columnFilters: TaskColumnFilters;
  onColumnFilterChange: (column: keyof TaskColumnFilters, value: string) => void;
  onHideInlineFilters: () => void;
}) {
  const columns: ColumnDef<TaskRecord>[] = [
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <button
          className="cursor-pointer font-medium hover:underline"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row.original);
          }}
        >
          #{row.original.id}
        </button>
      )
    },
    {
      id: "task",
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <div className="max-w-96">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{row.original.title}</span>
            {row.original.closurePending ? (
              <span className="shrink-0 rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-900">
                Closure pending
              </span>
            ) : null}
          </div>
          <div className="truncate text-xs text-muted-foreground">{row.original.description}</div>
        </div>
      )
    },
    {
      id: "list",
      accessorKey: "listIn",
      header: "List in",
      cell: ({ row }) => row.original.listIn ?? "—"
    },
    {
      id: "due",
      accessorKey: "dueDate",
      header: "Due date",
      cell: ({ row }) => formatDate(row.original.dueDate)
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <span
          className={`inline-block size-3 rounded-full ${priorityTone(row.original.priority)}`}
          title={row.original.priorityName}
        />
      )
    },
    { id: "creator", accessorKey: "creatorName", header: "Creator" },
    {
      id: "assignee",
      accessorKey: "assignedTo",
      header: "Assigned to",
      cell: ({ row }) => row.original.assignedTo ?? "—"
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <WorkspaceStatusBadge status={row.original.status} label={row.original.statusName} />
      )
    },
    {
      id: "actions",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => (
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <WorkspaceRowActions
            title={`Task ${row.original.title}`}
            onView={() => onOpen(row.original)}
            {...(canEdit ? { onEdit: () => onEdit(row.original) } : {})}
          />
        </div>
      )
    }
  ];
  return (
    <WorkspaceTable
      columns={columns.filter(
        (column) =>
          column.id === "id" || column.id === "actions" || visibleColumns[column.id ?? ""] !== false
      )}
      data={items}
      {...(showInlineFilters
        ? {
            filterRow: (columnId: string) => {
              const filter = filters[columnId];
              return filter ? (
                <TaskInlineFilter
                  label={filter.label}
                  value={columnFilters[filter.key] ?? ""}
                  onChange={(value) => onColumnFilterChange(filter.key, value)}
                  onHide={onHideInlineFilters}
                />
              ) : null;
            }
          }
        : {})}
      emptyState="No tasks found."
      isLoading={loading}
      minWidth="1020px"
      onRowClick={onOpen}
    />
  );
}
function priorityTone(code: string) {
  return code === "urgent" || code === "high"
    ? "bg-orange-500"
    : code === "low"
      ? "bg-sky-500"
      : "bg-teal-500";
}
function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}-${month}-${year}`;
}
