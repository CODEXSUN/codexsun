import { BarChart3, CalendarCheck2, CircleAlert, Users } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { formatDate, formatDateTime } from "@codexsun/ui/workspace";
import { useHrmsOverview } from "./overview.hooks";
import type { HrmsOverviewGateway } from "./overview.services";
// Read-only application desk and static onboarding; business CRUD belongs in future owner leaves.
export function HrmsOverviewWorkspace({
  gateway,
  currentUserName,
  onOpenAttendance,
  onOpenEmployees
}: {
  gateway: HrmsOverviewGateway;
  currentUserName: string;
  onOpenAttendance: () => void;
  onOpenEmployees: () => void;
}) {
  const overview = useHrmsOverview(gateway);
  return (
    <section className="mx-auto max-w-6xl space-y-7 pb-10">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="mt-1 text-3xl font-semibold">{currentUserName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Workforce and attendance at a glance.</p>
      </div>
      {overview.isPending && <Skeleton className="h-24" />}
      {overview.isError && (
        <WorkspaceFormBanner title="HRMS could not be loaded">
          <p>{overview.error.message}</p>
          <Button
            disabled={overview.isFetching}
            variant="outline"
            onClick={() => void overview.refetch()}
          >
            Retry
          </Button>
        </WorkspaceFormBanner>
      )}
      {overview.isSuccess && (
        <>
          <OverviewDashboard
            data={overview.data}
            checkedAt={overview.data.checkedAt}
            onOpenAttendance={onOpenAttendance}
            onOpenEmployees={onOpenEmployees}
          />
        </>
      )}
    </section>
  );
}

function OverviewDashboard({
  data,
  checkedAt,
  onOpenAttendance,
  onOpenEmployees
}: {
  data: NonNullable<ReturnType<typeof useHrmsOverview>["data"]>;
  checkedAt: string;
  onOpenAttendance: () => void;
  onOpenEmployees: () => void;
}) {
  const attendance = data.attendance;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Users}
          label="Active employees"
          value={attendance.activeEmployees}
          detail="Current workforce"
        />
        <Metric
          icon={CalendarCheck2}
          label="Present today"
          value={attendance.presentToday}
          detail={`${attendance.attendanceRate}% of active employees`}
        />
        <Metric
          icon={CircleAlert}
          label="No record today"
          value={attendance.notMarkedToday}
          detail={`${attendance.markedToday} active employees have a record`}
        />
        <Metric
          icon={BarChart3}
          label="Absent today"
          value={attendance.absentToday}
          detail={`${attendance.leaveToday} on leave · ${attendance.holidayToday} holiday`}
        />
      </div>
      {attendance.notMarkedToday ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-300 p-4">
          <span>
            {attendance.notMarkedToday}{" "}
            {attendance.notMarkedToday === 1 ? "employee has" : "employees have"} no attendance
            record for {formatDate(attendance.today)}.
          </span>
          <Button variant="outline" onClick={onOpenAttendance}>
            Mark attendance
          </Button>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold">Recorded attendance this week</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily records by attendance status. This view does not account for work schedules.
          </p>
          <div
            className="mt-5 flex items-end gap-3"
            role="img"
            aria-label="Attendance counts by status for the last seven days"
          >
            {attendance.week.map((day) => {
              const total = day.present + day.absent + day.leave + day.holiday;
              const scale = Math.max(
                1,
                ...attendance.week.map(
                  (item) => item.present + item.absent + item.leave + item.holiday
                )
              );
              return (
                <div
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  key={day.date}
                  title={`${formatDate(day.date)}: ${day.present} present, ${day.absent} absent, ${day.leave} leave`}
                >
                  <span className="text-xs tabular-nums text-muted-foreground">{total}</span>
                  <div
                    className="flex h-28 w-full max-w-12 flex-col justify-end overflow-hidden rounded-t bg-muted"
                    aria-hidden="true"
                  >
                    {day.holiday ? (
                      <div
                        className="bg-slate-400"
                        style={{ height: `${(day.holiday / scale) * 100}%` }}
                      />
                    ) : null}
                    {day.leave ? (
                      <div
                        className="bg-amber-400"
                        style={{ height: `${(day.leave / scale) * 100}%` }}
                      />
                    ) : null}
                    {day.absent ? (
                      <div
                        className="bg-rose-500"
                        style={{ height: `${(day.absent / scale) * 100}%` }}
                      />
                    ) : null}
                    {day.present ? (
                      <div
                        className="bg-emerald-600"
                        style={{ height: `${(day.present / scale) * 100}%` }}
                      />
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(day.date).slice(0, 5)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Legend color="bg-emerald-600" label="Present" />
            <Legend color="bg-rose-500" label="Absent" />
            <Legend color="bg-amber-400" label="Leave" />
            <Legend color="bg-slate-400" label="Holiday" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Recent attendance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest employee records · {formatDateTime(checkedAt)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenAttendance}>
              View attendance
            </Button>
          </div>
          {attendance.recent.length ? (
            <div className="mt-4 divide-y">
              {attendance.recent.slice(0, 6).map((record) => (
                <div className="flex items-center justify-between gap-3 py-3" key={record.id}>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{record.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.employeeCode} · {formatDate(record.workDate)}
                      {record.checkIn ? ` · ${record.checkIn}` : ""}
                    </p>
                  </div>
                  <WorkspaceStatusBadge
                    label={capitalize(record.status)}
                    tone={
                      record.status === "present"
                        ? "success"
                        : record.status === "absent"
                          ? "danger"
                          : record.status === "leave"
                            ? "warning"
                            : "info"
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No attendance has been recorded yet.
            </p>
          )}
        </Card>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold">Workforce</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review employee profiles and linked user accounts.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {data.tenantName} ({data.tenantCode}) · Last refreshed {formatDateTime(checkedAt)}
          </p>
        </div>
        <Button variant="outline" onClick={onOpenEmployees}>
          Open employees
        </Button>
      </Card>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: typeof Users;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card className="border-l-4 border-l-primary p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function capitalize(value: string) {
  return value[0]!.toUpperCase() + value.slice(1);
}
