import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { formatDate } from "@codexsun/ui/workspace";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { RemoteEnquiry } from "./enquiry-sync.types";

export function RemoteEnquiryList({
  records,
  loading,
  selected,
  busy,
  enabled,
  onSelect,
  onSelectAll,
  onPull
}: {
  records: RemoteEnquiry[];
  loading: boolean;
  selected: Set<string>;
  busy: boolean;
  enabled: boolean;
  onSelect: (name: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onPull: (name: string) => void;
}) {
  const allSelected = records.length > 0 && records.every((item) => selected.has(item.name));
  const someSelected = records.some((item) => selected.has(item.name));
  const columns: ColumnDef<RemoteEnquiry>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label="Select all shown Frappe enquiries"
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(checked) => onSelectAll(checked === true)}
          disabled={!records.length || busy}
        />
      ),
      size: 48,
      enableSorting: false,
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select Frappe enquiry ${row.original.name}`}
          checked={selected.has(row.original.name)}
          onCheckedChange={(checked) => onSelect(row.original.name, checked === true)}
          disabled={busy}
        />
      )
    },
    { accessorKey: "name", header: "FRAPPE ID", size: 120 },
    { accessorKey: "title", header: "ENQUIRY" },
    {
      accessorKey: "date",
      header: "DATE",
      size: 130,
      cell: ({ row }) => (row.original.date ? formatDate(row.original.date) : "—")
    },
    { accessorKey: "status", header: "STATUS", size: 120 },
    { accessorKey: "priority", header: "PRIORITY", size: 120 },
    {
      id: "local",
      header: "LOCAL CRM",
      size: 135,
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={
            row.original.localEnquiryId ? `#${row.original.localEnquiryId} linked` : "Not imported"
          }
          tone={row.original.localEnquiryId ? "success" : "warning"}
        />
      )
    },
    {
      id: "action",
      header: "ACTION",
      size: 125,
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!enabled || busy}
          onClick={() => onPull(row.original.name)}
        >
          {row.original.localEnquiryId ? "Update local" : "Import"}
        </Button>
      )
    }
  ];
  return (
    <WorkspaceTable
      columns={columns}
      data={records}
      emptyState="No Frappe enquiries found."
      isLoading={loading}
      minWidth="950px"
    />
  );
}
