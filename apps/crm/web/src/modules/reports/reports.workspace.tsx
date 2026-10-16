import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { useEnquiryReport, useEnquiryOptions, type EnquiryReportFilters } from "../enquiry/index";
import { ReportsTable } from "./reports.table";
import type { ReportView } from "./reports.model";

const views: Array<{ id: ReportView; label: string }> = [
  { id: "list-in", label: "List in wise" },
  { id: "creator", label: "Creator wise" },
  { id: "assignee", label: "Assignee wise" },
  { id: "status", label: "Status wise" }
];

const viewTitles: Record<ReportView, string> = {
  "list-in": "List in",
  creator: "Creator",
  assignee: "Assignee",
  status: "Status"
};

export function CrmReportsWorkspace({
  onOpenEnquiries,
  onViewChange
}: {
  onOpenEnquiries: (filters: EnquiryReportFilters) => void;
  onViewChange: (title: string) => void;
}) {
  return <ReportsContent onOpenEnquiries={onOpenEnquiries} onViewChange={onViewChange} />;
}

function ReportsContent({
  onOpenEnquiries,
  onViewChange
}: {
  onOpenEnquiries: (filters: EnquiryReportFilters) => void;
  onViewChange: (title: string) => void;
}) {
  const [view, setView] = useState<ReportView>("list-in");
  const [draft, setDraft] = useState<EnquiryReportFilters>({});
  const [filters, setFilters] = useState<EnquiryReportFilters>({});
  const report = useEnquiryReport(filters, view);
  const options = useEnquiryOptions();
  const users = { data: options.data?.users, isLoading: options.isLoading };
  const invalidDates = Boolean(draft.fromDate && draft.toDate && draft.fromDate > draft.toDate);
  useEffect(() => onViewChange(viewTitles[view]), [onViewChange, view]);
  return (
    <WorkspacePage title="" className="pt-0 lg:pt-0" technicalName="page.crm.reports">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Enquiry report views">
          {views.map((item) => (
            <Button
              key={item.id}
              aria-pressed={view === item.id}
              type="button"
              variant={view === item.id ? "default" : "outline"}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-md border bg-card p-4">
          <label className="w-44 shrink-0 text-sm text-muted-foreground">
            From date
            <Input
              className="mt-1 w-44 min-w-0"
              type="date"
              value={draft.fromDate ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, fromDate: event.target.value || undefined })
              }
            />
          </label>
          <label className="w-44 shrink-0 text-sm text-muted-foreground">
            To date
            <Input
              className="mt-1 w-44 min-w-0"
              type="date"
              value={draft.toDate ?? ""}
              onChange={(event) => setDraft({ ...draft, toDate: event.target.value || undefined })}
            />
          </label>
          <div className="min-w-52 flex-[2] text-sm text-muted-foreground">
            <span>Assigned to</span>
            <div className="mt-1">
              <WorkspaceLookup
                ariaLabel="Assigned to"
                allowTextValue={false}
                clearable={false}
                loading={users.isLoading}
                placeholder="Search assignees"
                showAllOptionsOnFocus
                value={draft.assignedUserId ?? "all"}
                onValueChange={(value) =>
                  setDraft({ ...draft, assignedUserId: value === "all" ? undefined : value })
                }
                options={[
                  { value: "all", label: "All assignees" },
                  { value: "none", label: "Unassigned" },
                  ...(users.data ?? []).map((user) => ({
                    value: String(user.id),
                    label: user.name
                  }))
                ]}
              />
            </div>
          </div>
          <Button
            className="h-11"
            type="button"
            disabled={invalidDates}
            onClick={() => setFilters({ ...draft })}
          >
            Apply filters
          </Button>
          <Button
            className="h-11"
            type="button"
            variant="outline"
            onClick={() => {
              setDraft({});
              setFilters({});
            }}
          >
            Reset
          </Button>
        </div>
        {invalidDates ? (
          <p role="alert" className="text-sm text-destructive">
            From date must be on or before To date.
          </p>
        ) : null}
        {report.error ? (
          <p role="alert" className="text-sm text-destructive">
            {report.error.message}
          </p>
        ) : null}
        <ReportsTable
          rows={report.data ?? []}
          users={users.data ?? []}
          view={view}
          filters={filters}
          loading={report.isLoading}
          onOpenEnquiries={onOpenEnquiries}
        />
      </div>
    </WorkspacePage>
  );
}
