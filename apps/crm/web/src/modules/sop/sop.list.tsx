import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { SopStatusBadge } from "./sop.status";
import { Input } from "@codexsun/ui/components/input";
import type { Sop } from "./sop.services";

export const sopColumns = [
  { id: "code", label: "Code" },
  { id: "title", label: "SOP name" },
  { id: "purpose", label: "Purpose" },
  { id: "status", label: "Status" }
];
export function SopList({
  items,
  loading,
  visible,
  inlineFilters,
  columnFilters,
  onFilter,
  onOpen,
  onEdit,
  onToggle
}: {
  items: Sop[];
  loading: boolean;
  visible: Record<string, boolean>;
  inlineFilters: boolean;
  columnFilters: Record<string, string>;
  onFilter: (column: string, value: string) => void;
  onOpen: (sop: Sop) => void;
  onEdit: (sop: Sop) => void;
  onToggle: (sop: Sop) => void;
}) {
  const columns: LegacyColumnDef<Sop>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: "Code",
      size: 180,
      cell: ({ row }) => (
        <button
          type="button"
          className="whitespace-nowrap font-medium hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row.original);
          }}
        >
          {row.original.code}
        </button>
      )
    },
    { id: "title", accessorKey: "title", header: "SOP name", size: 240 },
    {
      id: "purpose",
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-lg text-muted-foreground">{row.original.purpose}</span>
      )
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <SopStatusBadge status={row.original.status} />
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <WorkspaceRowActions
          title={`SOP ${row.original.code}`}
          onView={() => onOpen(row.original)}
          onEdit={() => onEdit(row.original)}
          actions={[
            {
              id: "toggle-status",
              label: row.original.status === "active" ? "Deactivate" : "Activate",
              onSelect: () => onToggle(row.original)
            }
          ]}
        />
      )
    }
  ];
  return (
    <WorkspaceTable
      columns={columns.filter((column) => visible[column.id ?? ""] !== false)}
      data={items}
      isLoading={loading}
      onRowClick={onOpen}
      emptyState="No SOPs found."
      {...(inlineFilters
        ? {
            filterRow: (column: string) =>
              column !== "actions" ? (
                <Input
                  aria-label={`Filter ${column}`}
                  className="h-8"
                  value={columnFilters[column] ?? ""}
                  onChange={(event) => onFilter(column, event.target.value)}
                />
              ) : null
          }
        : {})}
    />
  );
}
