import { Badge } from "@codexsun/ui/components/badge";
import { Field } from "@codexsun/ui/components/field";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { REPORT_NAMES, readAlerts, readReport, reportQuery, type AlertsResult, type ReportName, type ReportScopeResult } from "./reports-api";

export function ReportsPage({ request }: { request: typeof fetch }) {
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  const [report, setReport] = useState<ReportName>("sales");
  const [businessDayId, setBusinessDayId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const location = business?.locations.find((item) => item.id === locationId);
  const openDay = location?.businessDay && location.businessDay.status === "open" ? location.businessDay : null;
  const effectiveDayId = businessDayId || openDay?.id || "";
  const query = business && locationId && effectiveDayId ? reportQuery(business.id, locationId, effectiveDayId) : null;
  const result = useQuery({
    enabled: Boolean(query),
    queryKey: ["qcafe", "reports", report, business?.id, locationId, effectiveDayId],
    queryFn: () => readReport(request, report, query!),
  });
  const alerts = useQuery({
    enabled: Boolean(query),
    queryKey: ["qcafe", "reports", "alerts", business?.id, locationId, effectiveDayId],
    queryFn: () => readAlerts(request, query!),
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <NativeSelect aria-label="Outlet" value={locationId} onChange={(event) => setLocationId(event.currentTarget.value)}>
          {business.locations.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Report"
          value={report}
          onChange={(event) => setReport(event.currentTarget.value as ReportName)}
        >
          {REPORT_NAMES.map((name) => (
            <NativeSelectOption key={name} value={name}>
              {name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Field label="Business day" htmlFor="reports-day">
          <NativeSelect className="w-full" id="reports-day" name="businessDayId" value={effectiveDayId} onChange={(event) => setBusinessDayId(event.currentTarget.value)}>
            {openDay ? (
              <NativeSelectOption value={openDay.id}>Open day {openDay.businessDate}</NativeSelectOption>
            ) : (
              <NativeSelectOption value="">No open day</NativeSelectOption>
            )}
          </NativeSelect>
        </Field>
        <Badge variant="outline">{alerts.data?.alerts.length ?? 0} alerts</Badge>
      </div>
      <ReportTable result={result.data} />
      {result.error ? <p className="text-sm text-destructive">{result.error.message}</p> : null}
      <section className="grid gap-3 border-t pt-4">
        <h2 className="text-sm font-semibold">Dashboard alerts</h2>
        {(alerts.data?.alerts ?? []).map((alert, index) => (
          <div className="flex flex-wrap items-center gap-2 border-b py-2 text-sm" key={`${alert.type}-${index}`}>
            <Badge variant={alert.type === "booking-conflict" ? "destructive" : "secondary"}>{alert.type}</Badge>
            <span className="text-muted-foreground">{alert.detail}</span>
            <span className="text-xs text-muted-foreground">
              {alert.subjectType} · {alert.subjectId.slice(0, 8)}
            </span>
          </div>
        ))}
        {!(alerts.data?.alerts ?? []).length ? <p className="text-sm text-muted-foreground">No alerts in scope.</p> : null}
      </section>
    </div>
  );
}

function ReportTable({ result }: { result?: ReportScopeResult }) {
  if (!result) return <p className="text-sm text-muted-foreground">Select a scope to load the report.</p>;
  const columns = Object.keys(result.rows[0] ?? {});
  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Scope {result.scope.businessId.slice(0, 8)} · {result.scope.locationId.slice(0, 8)} · {result.scope.from} → {result.scope.to}
      </p>
      {result.rows.length ? (
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              {columns.slice(0, 6).map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.slice(0, 50).map((row, index) => (
              <TableRow key={index}>
                {columns.slice(0, 6).map((column) => (
                  <TableCell key={column}>{cell(row[column])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No posted records in scope.</p>
      )}
      <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(result.totals, null, 2)}</pre>
    </div>
  );
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export type { AlertsResult };
