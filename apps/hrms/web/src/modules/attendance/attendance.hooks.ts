import { useQuery } from "@tanstack/react-query";
import type { AttendanceGateway } from "./attendance.services";
import type { AttendanceFilters } from "./attendance.types";

export const attendanceQueryKey = ["hrms", "attendance"] as const;
export const useAttendance = (gateway: AttendanceGateway, filters: AttendanceFilters) =>
  useQuery({ queryKey: [...attendanceQueryKey, filters], queryFn: () => gateway.list(filters) });
export const useAttendanceEmployees = (gateway: AttendanceGateway) =>
  useQuery({ queryKey: [...attendanceQueryKey, "employees"], queryFn: gateway.employees });
