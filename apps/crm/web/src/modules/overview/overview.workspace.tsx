import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  PhoneCall,
  Users
} from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { listActivities } from "../activities";
import { listCallLogs } from "../call-log";
import { useEnquirySummary } from "../enquiry";
import { getReportOptions, listReports } from "../duty-report";
import { getDutyOptions, listDuties, listOwnDuties } from "../duty-assignment";
import { listSopItems, listSops } from "../sop";
import { listTasks } from "../task";
import type { ActivityFilters } from "../activities";
import type { CallLogFilters } from "../call-log";

type CrmPage =
  | "crm.enquiries"
  | "crm.tasks"
  | "crm.call-logs"
  | "crm.activities"
  | "crm.sops"
  | "crm.duties"
  | "crm.duty-reporting"
  | "crm.contacts";

export function CrmOverviewWorkspace({
  currentUserName,
  onOpenPage
}: {
  currentUserName: string;
  onOpenPage: (page: CrmPage) => void;
}) {
  const today = localToday();
  const enquiries = useEnquirySummary();
  const tasks = useQuery({
    queryKey: ["crm", "tasks", "overview"],
    queryFn: () => listTasks("", 1, 1, "all", {}),
    refetchInterval: 30_000
  });
  const calls = useQuery({
    queryKey: ["crm", "call-logs", "overview"],
    queryFn: () => listCallLogs(callLogFilters),
    refetchInterval: 30_000
  });
  const activities = useQuery({
    queryKey: ["crm", "activities", "overview"],
    queryFn: () => listActivities(activityFilters),
    refetchInterval: 30_000
  });
  const sops = useQuery({
    queryKey: ["crm", "sops", "overview"],
    queryFn: listSops,
    refetchInterval: 30_000
  });
  const sopItems = useQuery({
    queryKey: ["crm", "sop-items", "overview"],
    queryFn: listSopItems,
    refetchInterval: 30_000
  });
  const dutyOptions = useQuery({
    queryKey: ["crm", "duties", "overview-options"],
    queryFn: getDutyOptions
  });
  const duties = useQuery({
    queryKey: ["crm", "duties", "overview", dutyOptions.data?.canViewAll],
    queryFn: () => (dutyOptions.data?.canViewAll ? listDuties() : listOwnDuties()),
    enabled: dutyOptions.data !== undefined,
    refetchInterval: 30_000
  });
  const reportOptions = useQuery({
    queryKey: ["crm", "duty-reports", "overview-options"],
    queryFn: getReportOptions
  });
  const reports = useQuery({
    queryKey: ["crm", "duty-reports", "overview"],
    queryFn: () => listReports("", 1, "", ""),
    enabled: reportOptions.data?.canViewAll === true,
    refetchInterval: 30_000
  });
  const blockedReports = useQuery({
    queryKey: ["crm", "duty-reports", "overview", today, "blocked"],
    queryFn: () => listReports("", 1, today, today, { result: "blocked" }),
    enabled: reportOptions.data?.canViewAll === true,
    refetchInterval: 30_000
  });

  const activeTasks = (tasks.data?.statusCounts ?? [])
    .filter(({ code }) => !["won", "lost", "closed"].includes(code))
    .reduce((sum, row) => sum + row.count, 0);
  const activeDuties = (duties.data ?? []).filter((duty) => duty.status === "active").length;
  const completedCalls = countCode(calls.data?.statusCounts ?? [], "completed");
  const openCalls = (calls.data?.statusCounts ?? [])
    .filter(({ code }) =>
      ["initiated", "ringing", "in progress", "queued"].includes(code.toLowerCase())
    )
    .reduce((sum, row) => sum + row.count, 0);
  const errors = [
    enquiries.error,
    tasks.error,
    calls.error,
    activities.error,
    sops.error,
    sopItems.error,
    dutyOptions.error,
    duties.error,
    reportOptions.error,
    reports.error,
    blockedReports.error
  ].filter((error): error is Error => Boolean(error));

  return (
    <section className="mx-auto max-w-7xl space-y-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">CRM administration</p>
          <h1 className="mt-1 text-2xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workload and recent operational activity across CRM.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">Welcome, {currentUserName}</span>
      </header>

      {errors.length ? (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          Some overview totals could not be loaded. Each available module is shown below.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={BriefcaseBusiness}
          title="Enquiries"
          accentClassName="border-l-sky-400"
          total={enquiries.data?.allCount}
          detail={`${enquiries.data?.all.active ?? 0} active · ${enquiries.data?.all.attention ?? 0} need attention`}
          onOpen={() => onOpenPage("crm.enquiries")}
        />
        <SummaryCard
          icon={ClipboardList}
          title="Tasks"
          accentClassName="border-l-violet-400"
          total={tasks.data?.total}
          detail={`${activeTasks} active · ${countCode(tasks.data?.statusCounts ?? [], "new")} new`}
          onOpen={() => onOpenPage("crm.tasks")}
        />
        <SummaryCard
          icon={PhoneCall}
          title="Call logs"
          accentClassName="border-l-emerald-400"
          total={calls.data?.total}
          detail={`${openCalls} in progress · ${completedCalls} completed`}
          onOpen={() => onOpenPage("crm.call-logs")}
        />
        <SummaryCard
          icon={Activity}
          title="Activities"
          accentClassName="border-l-amber-400"
          total={activities.data?.total}
          detail="Enquiry activity records"
          onOpen={() => onOpenPage("crm.activities")}
        />
        <SummaryCard
          icon={ClipboardCheck}
          title="SOPs"
          accentClassName="border-l-rose-400"
          total={sops.data?.length}
          detail={`${(sops.data ?? []).filter((sop) => sop.status === "active").length} active · ${sopItems.data?.length ?? 0} steps`}
          onOpen={() => onOpenPage("crm.sops")}
        />
        <SummaryCard
          icon={Users}
          title="Duties"
          accentClassName="border-l-cyan-400"
          total={duties.data?.length}
          detail={`${activeDuties} active assignments`}
          onOpen={() => onOpenPage("crm.duties")}
        />
        {reportOptions.data?.canViewAll ? (
          <SummaryCard
            icon={ClipboardCheck}
            title="Duty reports"
            accentClassName="border-l-indigo-400"
            total={reports.data?.total}
            detail={`${blockedReports.data?.total ?? 0} blocked today`}
            onOpen={() => onOpenPage("crm.duty-reporting")}
          />
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Enquiry actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current workload in your permitted enquiry scope
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenPage("crm.enquiries")}>
              Open enquiries <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
          <MetricRows
            items={[
              ["All enquiries", enquiries.data?.allCount],
              ["Active enquiries", enquiries.data?.all.active],
              ["Needs attention", enquiries.data?.all.attention],
              ...(enquiries.data?.all.statusCounts ?? []).map(
                ({ code, count }) => [statusLabel(code), count] as [string, number]
              ),
              ["Assigned to me · active", enquiries.data?.assigned.active],
              ["Assigned to me · needs attention", enquiries.data?.assigned.attention],
              ["Created by me · active", enquiries.data?.created.active],
              ["Created in the last 7 days", enquiries.data?.created.created7]
            ]}
          />
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Task actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Status totals for tasks visible to you
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenPage("crm.tasks")}>
              Open tasks <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
          <MetricRows
            items={[
              ["All tasks", tasks.data?.total],
              ["Active tasks", activeTasks],
              ...(tasks.data?.statusCounts ?? []).map(
                ({ code, count }) => [statusLabel(code), count] as [string, number]
              )
            ]}
          />
        </Card>
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Latest enquiry activity</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recent changes and comments</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenPage("crm.activities")}>
              Open activities <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
          <div className="mt-3 divide-y">
            {(activities.data?.items ?? []).slice(0, 5).map((item) => (
              <div
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm"
                key={item.id}
              >
                <span className="min-w-0 flex-1 truncate">
                  <strong>#{item.enquiryNo}</strong> · {item.action} ·{" "}
                  {item.details || item.contact}
                </span>
                <span className="text-muted-foreground">
                  {item.actor} · {formatDate(item.createdAt)}
                </span>
              </div>
            ))}
            {!activities.isLoading && !activities.data?.items.length ? (
              <p className="py-3 text-sm text-muted-foreground">No activity records found.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  accentClassName,
  total,
  detail,
  onOpen
}: {
  icon: typeof Activity;
  title: string;
  accentClassName: string;
  total: number | undefined;
  detail: string;
  onOpen: () => void;
}) {
  return (
    <Card
      className={`border-l-4 ${accentClassName} p-0 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none`}
    >
      <button
        type="button"
        className="group block w-full rounded-[inherit] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={`Open ${title} list and filters`}
        onClick={onOpen}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="size-4" />
          {title}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-3xl font-semibold tabular-nums">
              {total === undefined ? "—" : total}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <ArrowRight
            className="mb-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </div>
      </button>
    </Card>
  );
}

function MetricRows({ items }: { items: Array<[string, number | undefined]> }) {
  return (
    <dl className="mt-3 divide-y">
      {items.map(([label, value]) => (
        <div className="flex justify-between gap-4 py-2 text-sm" key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function countCode(counts: Array<{ code: string; count: number }>, code: string) {
  return counts.find((item) => item.code.toLowerCase() === code.toLowerCase())?.count ?? 0;
}

function statusLabel(code: string) {
  return code.replaceAll("-", " ").replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

const callLogFilters = {
  page: 1,
  pageSize: 5,
  search: "",
  type: "",
  status: ""
} satisfies CallLogFilters;
const activityFilters = {
  page: 1,
  pageSize: 5,
  search: "",
  contact: "",
  enquiry: "",
  allocatedTo: "",
  listIn: "",
  status: "",
  action: "",
  actor: ""
} satisfies ActivityFilters;

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
