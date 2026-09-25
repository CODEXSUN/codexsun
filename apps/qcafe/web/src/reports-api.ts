export type ReportScopeResult = {
  rows: Array<Record<string, unknown>>;
  scope: { businessDayId: string | null; businessId: string; from: string; locationId: string; to: string };
  totals: Record<string, unknown>;
};

export type AlertsResult = {
  alerts: Array<{ detail: string; subjectId: string; subjectType: string; type: string }>;
  scope: ReportScopeResult["scope"];
};

const REPORTS = ["sales", "taxes", "payments", "items", "tables", "kitchen", "shifts", "stock", "events"] as const;

export type ReportName = (typeof REPORTS)[number];

export const REPORT_NAMES: readonly ReportName[] = REPORTS;

export function readReport(request: typeof fetch, name: ReportName, query: URLSearchParams) {
  return reportsRequest<ReportScopeResult>(request, `/api/v1/qcafe/reports/${name}?${query}`);
}

export function readAlerts(request: typeof fetch, query: URLSearchParams) {
  return reportsRequest<AlertsResult>(request, `/api/v1/qcafe/reports/alerts?${query}`);
}

export function reportQuery(businessId: string, locationId: string, businessDayId?: string) {
  const query = new URLSearchParams({ businessId, locationId });
  if (businessDayId) query.set("businessDayId", businessDayId);
  return query;
}

async function reportsRequest<T>(request: typeof fetch, path: string): Promise<T> {
  const response = await request(path, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `Reports request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
