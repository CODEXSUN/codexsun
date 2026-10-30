import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { listReportSummary } from "./duty-report.services";
import type { DutyReportGroup, DutyReportView, DutyReportDrilldown } from "./duty-report.types";
const views = [
  { id: "sop", label: "SOP wise", title: "SOP" },
  { id: "user", label: "User wise", title: "User" },
  { id: "department", label: "Department wise", title: "Department" },
  { id: "frequency", label: "Frequency wise", title: "Frequency" }
] as const;
export type ReportOverviewState = {
  view: DutyReportView;
  filters: { search: string; from: string; to: string };
};
export function DutyReportOverview({
  initialState,
  onStateChange,
  enabled,
  canCreate,
  error,
  onCreate,
  onOpen
}: {
  initialState: ReportOverviewState;
  onStateChange: (state: ReportOverviewState) => void;
  enabled: boolean;
  canCreate: boolean;
  error: string;
  onCreate: () => void;
  onOpen: (
    filters: DutyReportDrilldown,
    context: { search: string; from: string; to: string; label: string }
  ) => void;
}) {
  const [view, setView] = useState<DutyReportView>(initialState.view);
  const [draft, setDraft] = useState(initialState.filters);
  const [filters, setFilters] = useState(draft);
  useEffect(() => onStateChange({ view, filters }), [view, filters, onStateChange]);
  const query = useQuery({
    queryKey: ["crm", "duty-reports", "summary", view, filters],
    queryFn: () => listReportSummary(view, filters.search, filters.from, filters.to),
    enabled,
    refetchInterval: 15000
  });
  const rows = query.data ?? [];
  const total = rows.reduce(
    (sum, row) => ({
      key: "__total",
      label: "Total",
      completed: sum.completed + row.completed,
      blocked: sum.blocked + row.blocked,
      total: sum.total + row.total
    }),
    { key: "__total", label: "Total", completed: 0, blocked: 0, total: 0 }
  );
  function open(row: DutyReportGroup, result?: "completed" | "blocked") {
    const selected: DutyReportDrilldown =
      row.key === "__total"
        ? {}
        : view === "sop"
          ? { sopItemId: Number(row.key) }
          : view === "user"
            ? { assigneeId: Number(row.key) }
            : view === "department"
              ? { department: row.key }
              : { frequency: row.key };
    onOpen(
      { ...selected, ...(result ? { result } : {}) },
      { ...filters, label: `${row.label}${result ? ` - ${result}` : ""}` }
    );
  }
  const invalid = !!draft.from && !!draft.to && draft.from > draft.to;
  return (
    <WorkspacePage
      title="Duty Reporting"
      variant="list"
      technicalName="page.crm.duty.reporting"
      actions={
        canCreate ? (
          <Button onClick={onCreate}>
            <Plus className="size-4" />
            New report
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap gap-2" aria-label="Duty report views">
        {views.map((option) => (
          <Button
            key={option.id}
            variant={view === option.id ? "default" : "outline"}
            aria-pressed={view === option.id}
            onClick={() => setView(option.id)}
          >
            {option.label}
          </Button>
        ))}
        <Button variant="outline" onClick={() => open(total)}>
          All reports
        </Button>
      </div>
      <form
        className="flex flex-wrap items-end gap-3 rounded-md border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) setFilters(draft);
        }}
      >
        <label className="w-44 text-sm text-muted-foreground">
          From date
          <Input
            aria-label="From date"
            type="date"
            className="mt-1"
            value={draft.from}
            onChange={(event) => setDraft({ ...draft, from: event.target.value })}
          />
        </label>
        <label className="w-44 text-sm text-muted-foreground">
          To date
          <Input
            aria-label="To date"
            type="date"
            className="mt-1"
            value={draft.to}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          />
        </label>
        <label className="min-w-52 flex-1 text-sm text-muted-foreground">
          Search
          <Input
            aria-label="Search reports"
            placeholder="SOP, user, or actions"
            className="mt-1"
            value={draft.search}
            onChange={(event) => setDraft({ ...draft, search: event.target.value })}
          />
        </label>
        <Button disabled={invalid || !enabled}>Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const empty = { search: "", from: "", to: "" };
            setDraft(empty);
            setFilters(empty);
          }}
        >
          Clear
        </Button>
      </form>
      {invalid ? (
        <p role="alert" className="text-sm text-destructive">
          From date must be on or before to date.
        </p>
      ) : null}
      {error || query.error ? (
        <p role="alert" className="text-sm text-destructive">
          {error || query.error?.message}
        </p>
      ) : null}
      <WorkspaceTable<DutyReportGroup>
        data={rows.length ? [...rows, total] : []}
        isLoading={query.isLoading && enabled}
        emptyState={
          enabled
            ? "No duty reports match these filters."
            : error
              ? "Report access is unavailable."
              : "Loading report access..."
        }
        columns={[
          {
            id: "group",
            accessorKey: "label",
            header: views.find((option) => option.id === view)?.title ?? "SOP",
            cell: ({ row }) => (
              <span className="font-medium">
                {view === "frequency" && row.original.key !== "__total"
                  ? row.original.key === "annually"
                    ? "Yearly"
                    : row.original.label.charAt(0).toUpperCase() + row.original.label.slice(1)
                  : row.original.label}
              </span>
            )
          },
          ...(["completed", "blocked", "total"] as const).map((key) => ({
            id: key,
            accessorKey: key,
            header: key.charAt(0).toUpperCase() + key.slice(1),
            cell: ({ row }: { row: { original: DutyReportGroup } }) =>
              row.original[key] ? (
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  aria-label={`Open ${key} reports for ${row.original.label}`}
                  onClick={() => open(row.original, key === "total" ? undefined : key)}
                >
                  {row.original[key]}
                </button>
              ) : (
                <span>0</span>
              )
          }))
        ]}
      />
    </WorkspacePage>
  );
}
