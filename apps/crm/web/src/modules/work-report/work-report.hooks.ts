import { useQuery } from "@tanstack/react-query";
import { listWorkReports } from "./work-report.services";
import type { WorkReportTarget } from "./work-report.types";
export const workReportKey = (target: WorkReportTarget) => [
  "crm",
  "work-reports",
  target.enquiryId,
  target.taskId
];
export const useWorkReports = (target: WorkReportTarget) =>
  useQuery({
    queryKey: workReportKey(target),
    queryFn: () => listWorkReports(target),
    refetchInterval: 10000
  });
