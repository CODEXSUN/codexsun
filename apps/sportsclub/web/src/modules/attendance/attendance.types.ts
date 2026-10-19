export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceSavePayload = {
  sessionUuid: string;
  memberUuid: string;
  sessionDate: string;
  status: AttendanceStatus;
  notes?: string | null | undefined;
};

export type AttendanceRecord = AttendanceSavePayload & {
  id: number;
  uuid: string;
  studentName?: string | null | undefined;
  studentMemberNo?: string | null | undefined;
  sessionTitle?: string | null | undefined;
  markedBy?: string | null | undefined;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type AttendancePage = {
  items: AttendanceRecord[];
  total: number;
};

export type AttendanceSummary = {
  totalMarked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

export type AttendanceColumnFilters = {
  sessionUuid?: string | undefined;
  memberUuid?: string | undefined;
  sessionDate?: string | undefined;
  status?: string | undefined;
};
