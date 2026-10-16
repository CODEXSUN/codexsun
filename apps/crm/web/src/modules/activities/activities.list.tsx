import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { CrmStatusBadge } from "../../crm-colors";
import { Input } from "@codexsun/ui/components/input";
import type { ActivityColumnFilter, ActivityFilters, ActivityItem } from "./activities.types";

const filterLabels: Partial<Record<keyof ActivityFilters, string>> = {
  contact: "Contacts",
  enquiry: "Enquiry ID",
  allocatedTo: "Allocated to",
  listIn: "List in",
  action: "Activity",
  actor: "User"
};

export const activityColumns = [
  { id: "createdAt", label: "Date" },
  { id: "action", label: "Activity" },
  { id: "actor", label: "User" },
  { id: "contact", label: "Contacts" },
  { id: "enquiry", label: "Enquiry ID" },
  { id: "allocatedTo", label: "Allocated to" },
  { id: "listIn", label: "List in" },
  { id: "status", label: "Status" }
] as const;

type ActivityCell = { row: { original: ActivityItem } };

export function ActivitiesList({
  records,
  loading,
  filters,
  showInlineFilters,
  visibleColumns,
  onFilterChange,
  onHideInlineFilters,
  onOpenEnquiry
}: {
  records: ActivityItem[];
  loading: boolean;
  filters: ActivityFilters;
  showInlineFilters: boolean;
  visibleColumns: Record<string, boolean>;
  onFilterChange: (column: ActivityColumnFilter, value: string) => void;
  onHideInlineFilters: () => void;
  onOpenEnquiry: (id: number) => void;
}) {
  const columns: ColumnDef<ActivityItem>[] = [
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }: ActivityCell) => formatActivityDate(row.original.createdAt)
    },
    {
      id: "action",
      accessorKey: "action",
      header: "Activity",
      cell: ({ row }: ActivityCell) => {
        const details = row.original.details.trim();
        const label = row.original.action.replaceAll("-", " ");
        const showLabel = details && !details.toLowerCase().includes(label.toLowerCase());
        return (
          <div className="max-w-80">
            <span className="font-medium">{details || label}</span>
            {showLabel ? (
              <span className="block text-xs text-muted-foreground">{label}</span>
            ) : null}
          </div>
        );
      }
    },
    { id: "actor", accessorKey: "actor", header: "User" },
    { id: "contact", accessorKey: "contact", header: "Contacts" },
    {
      id: "enquiry",
      accessorKey: "enquiryNo",
      header: "Enquiry ID",
      cell: ({ row }: ActivityCell) => (
        <button
          className="cursor-pointer font-medium hover:underline"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenEnquiry(row.original.enquiryId);
          }}
        >
          #{row.original.enquiryNo}
        </button>
      )
    },
    {
      id: "allocatedTo",
      accessorKey: "allocatedTo",
      header: "Allocated to",
      cell: ({ row }: ActivityCell) => row.original.allocatedTo ?? "—"
    },
    {
      id: "listIn",
      accessorKey: "listIn",
      header: "List in",
      cell: ({ row }: ActivityCell) => row.original.listIn ?? "—"
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: ActivityCell) => (
        <CrmStatusBadge code={row.original.statusCode} label={row.original.status} />
      )
    }
  ].filter((column) => visibleColumns[column.id] !== false);
  return (
    <WorkspaceTable
      columns={columns}
      data={records}
      emptyState="No activity matches the current filters."
      isLoading={loading}
      minWidth="1100px"
      onRowClick={(record) => onOpenEnquiry(record.enquiryId)}
      {...(showInlineFilters
        ? {
            filterRow: (columnId: string) => {
              const label = filterLabels[columnId as ActivityColumnFilter];
              if (!label) return null;
              const column = columnId as ActivityColumnFilter;
              return (
                <Input
                  aria-label={`Filter ${label}`}
                  className="h-7 bg-background"
                  value={filters[column]}
                  onChange={(event) => onFilterChange(column, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      if (event.currentTarget.value) event.currentTarget.select();
                      else onHideInlineFilters();
                    }
                  }}
                />
              );
            }
          }
        : {})}
    />
  );
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hour = String(date.getHours() % 12 || 12).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() < 12 ? "am" : "pm";
  return `${day}-${month}-${date.getFullYear()} - ${hour}:${minute} ${period}`;
}
