import { useQuery } from "@tanstack/react-query";
import { listWorkHistory } from "./work-report.services";
import type { WorkReportTarget } from "./work-report.types";
export const workReportKey = (target: WorkReportTarget) => [
  "crm",
  "work-reports",
  target.enquiryId,
  target.taskId
];
export const useWorkReports = (target: WorkReportTarget, page = 1, checkpoints = false) =>
  useQuery({
    queryKey: [...workReportKey(target), "history", page, checkpoints],
    queryFn: () => listWorkHistory(target, page, checkpoints),
    refetchInterval: 10000
  });
