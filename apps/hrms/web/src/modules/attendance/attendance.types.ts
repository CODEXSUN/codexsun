export type AttendanceStatus = "present" | "absent" | "leave" | "holiday";
export type AttendanceInput = {
  employeeId: string;
  workDate: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  notes: string;
};
export type AttendanceRecord = AttendanceInput & {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type AttendanceEmployee = {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
};
export type AttendanceFilters = { date: string; search: string; status: "all" | AttendanceStatus };
export type AttendanceOverview = {
  activeEmployees: number;
  markedToday: number;
  presentToday: number;
  absentToday: number;
  leaveToday: number;
  holidayToday: number;
  notMarkedToday: number;
  attendanceRate: number;
  today: string;
  week: Array<{ date: string; present: number; absent: number; leave: number; holiday: number }>;
  recent: Array<
    Pick<
      AttendanceRecord,
      "id" | "employeeCode" | "employeeName" | "workDate" | "status" | "checkIn" | "checkOut"
    >
  >;
};
