import { crmRequest } from "../../crm-request";
import type { WorkReport, WorkReportPayload, WorkReportTarget } from "./work-report.types";
export const listWorkReports = (target: WorkReportTarget) =>
  crmRequest<WorkReport[]>(
    `/crm/work-reports?${target.enquiryId !== null ? `enquiryId=${target.enquiryId}` : `taskId=${target.taskId}`}`
  );
export const createWorkReport = (payload: WorkReportPayload) =>
  crmRequest<WorkReport>("/crm/work-reports", { method: "POST", body: JSON.stringify(payload) });
