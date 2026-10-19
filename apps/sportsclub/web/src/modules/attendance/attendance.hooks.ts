import { useQuery } from "@tanstack/react-query";
import { getAttendanceSummary, listAttendancePage } from "./attendance.services";
import type { AttendanceColumnFilters } from "./attendance.types";

export const attendanceQueryKeys = {
  all: ["sportsclub", "attendance"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    sessionDate?: string | undefined;
    status?: string | undefined;
    columnFilters?: AttendanceColumnFilters | undefined;
  }) => ["sportsclub", "attendance", "list", options] as const,
  summary: (date: string) => ["sportsclub", "attendance", "summary", date] as const
};

export function useAttendancePage(options: {
  page: number;
  pageSize: number;
  search: string;
  sessionDate?: string | undefined;
  status?: string | undefined;
  columnFilters?: AttendanceColumnFilters | undefined;
}) {
  return useQuery({
    queryKey: attendanceQueryKeys.list(options),
    queryFn: () => listAttendancePage(options)
  });
}

export function useAttendanceSummary(date: string) {
  return useQuery({
    queryKey: attendanceQueryKeys.summary(date),
    queryFn: () => getAttendanceSummary(date),
    enabled: Boolean(date)
  });
}
