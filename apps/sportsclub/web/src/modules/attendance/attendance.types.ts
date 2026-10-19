export type AttendanceStatus = "present" | "absent" | "excused" | "late";
export type AttendanceSavePayload = {
  sessionUuid: string;
  memberUuid: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string;
};
export type AttendanceRecord = AttendanceSavePayload & {
  uuid: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
};
export type AttendancePage = {
  items: AttendanceRecord[];
  total: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
};
export type AttendanceSummary = {
  totalMarked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
};
export type AttendanceColumnFilters = {
  sessionUuid?: string;
  memberUuid?: string;
  attendanceDate?: string;
  status?: AttendanceStatus;
};
