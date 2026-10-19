import { crmRequest } from "../../crm-request";
import type {
  WorkReportHistory,
  WorkReportHistoryFilter,
  WorkReportPayload,
  WorkReportTarget,
  WorkReport
} from "./work-report.types";
export const createWorkReport = (payload: WorkReportPayload) =>
  crmRequest<WorkReport>("/crm/work-reports", { method: "POST", body: JSON.stringify(payload) });

export const getWorkCheckpoint = (target: WorkReportTarget) =>
  crmRequest<{ checkedIn: boolean }>(
    `/crm/work-reports/checkpoint?${target.enquiryId !== null ? `enquiryId=${target.enquiryId}` : `taskId=${target.taskId}`}`
  );

export const listWorkHistory = (
  target: WorkReportTarget,
  page: number,
  filter: WorkReportHistoryFilter
) =>
  crmRequest<WorkReportHistory>(
    `/crm/work-reports/history?${target.enquiryId !== null ? `enquiryId=${target.enquiryId}` : `taskId=${target.taskId}`}&page=${page}&pageSize=100&filter=${filter}`
  );
