import { useQuery } from "@tanstack/react-query";
import { getAttendance, listAttendancePage } from "./attendance.services";
import type { AttendanceColumnFilters } from "./attendance.types";
export const attendanceQueryKeys = {
  all: ["sportsclub", "attendance"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    attendanceDate?: string | undefined;
    status?: string | undefined;
    columnFilters?: AttendanceColumnFilters | undefined;
  }) => ["sportsclub", "attendance", "list", options] as const,
  detail: (uuid: string) => ["sportsclub", "attendance", "detail", uuid] as const
};
export function useAttendancePage(options: {
  page: number;
  pageSize: number;
  search: string;
  attendanceDate?: string | undefined;
  status?: string | undefined;
  columnFilters?: AttendanceColumnFilters | undefined;
}) {
  return useQuery({
    queryKey: attendanceQueryKeys.list(options),
    queryFn: () => listAttendancePage(options)
  });
}
export function useAttendanceDetails(uuid: string | undefined) {
  return useQuery({
    queryKey: attendanceQueryKeys.detail(uuid ?? ""),
    queryFn: () => getAttendance(uuid!),
    enabled: Boolean(uuid)
  });
}
