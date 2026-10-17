import { dutyReportCreateSchema, dutyReportEditSchema } from "./duty-report.schema";
import { crmRequest } from "../../crm-request";
import type {
  DutyReport,
  DutyReportView,
  DutyReportGroup,
  DutyReportDrilldown
} from "./duty-report.types";
export type { DutyReport } from "./duty-report.types";
export const getReportOptions = () =>
  crmRequest<{ actorUserId: number | null; canCreate: boolean; canViewAll: boolean }>(
    "/crm/duty-reports/options"
  );
export const listReports = (
  search: string,
  page: number,
  from: string,
  to: string,
  filters: DutyReportDrilldown = {}
) => {
  const query = new URLSearchParams({ search, page: String(page), pageSize: "25", scope: "all" });
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined) query.set(key, String(value));
  return crmRequest<{ items: DutyReport[]; total: number }>(`/crm/duty-reports?${query}`);
};
export async function createReport(input: {
  assignmentId: number;
  performedDate: string;
  actions: string;
}) {
  const value = dutyReportCreateSchema.parse(input);
  const saved = await crmRequest<DutyReport>("/crm/duty-reports", {
    method: "POST",
    body: JSON.stringify({ ...value, result: "completed", issueDetails: "" })
  });
  if (saved.performedDate !== value.performedDate || saved.actions !== value.actions)
    throw new Error(
      "A report already exists for this duty period. Open it from the list to edit it."
    );
  return saved;
}
export const updateReport = (id: number, input: { performedDate: string; actions: string }) =>
  crmRequest<DutyReport>(`/crm/duty-reports/${id}`, {
    method: "PUT",
    body: JSON.stringify(dutyReportEditSchema.parse(input))
  });

export function listReportSummary(view: DutyReportView, search: string, from: string, to: string) {
  const query = new URLSearchParams({ view, search });
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return crmRequest<DutyReportGroup[]>(`/crm/duty-reports/summary?${query}`);
}
