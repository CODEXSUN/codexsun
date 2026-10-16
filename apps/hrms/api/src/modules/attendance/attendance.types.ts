import type { ColumnType, Generated, Kysely } from "kysely";

export const attendancePermissions = [
  "hrms.attendance.view",
  "hrms.attendance.create",
  "hrms.attendance.update",
  "hrms.attendance.delete"
] as const;

export type AttendancePermission = (typeof attendancePermissions)[number];
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

export type AttendanceEmployeeOption = {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
};

export type AttendanceFilters = {
  date?: string | undefined;
  search?: string | undefined;
  status?: "all" | AttendanceStatus;
};

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
  week: Array<{
    date: string;
    present: number;
    absent: number;
    leave: number;
    holiday: number;
  }>;
  recent: Array<{
    id: string;
    employeeCode: string;
    employeeName: string;
    workDate: string;
    status: AttendanceStatus;
    checkIn: string | null;
    checkOut: string | null;
  }>;
};

type Timestamp = ColumnType<Date | string, never, never>;

export type AttendanceDatabase = {
  hrms_attendance: {
    id: Generated<number>;
    uuid: string;
    employee_uuid: string;
    work_date: ColumnType<Date | string, string, string>;
    status: AttendanceStatus;
    check_in: string | null;
    check_out: string | null;
    notes: string;
    created_at: Timestamp;
    updated_at: Timestamp;
    deleted_at: ColumnType<Date | string | null, never, string | null>;
  };
  hrms_attendance_activity: {
    id: Generated<number>;
    uuid: string;
    attendance_uuid: string;
    action: string;
    actor_email: string;
    summary: string;
    status: Generated<string>;
    created_at: Timestamp;
    updated_at: Timestamp;
  };
  // Relation reads only; employee fields remain owned by the employee module.
  hrms_employees: {
    id: Generated<number>;
    uuid: string;
    employee_code: string;
    name: string;
    department: string;
    status: string;
    deleted_at: ColumnType<Date | string | null, never, string | null>;
  };
};

export type AttendanceContext = {
  database: Kysely<AttendanceDatabase>;
  actorEmail: string;
  authorize: (permission: AttendancePermission) => Promise<void>;
};

export type AttendancePermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; role_id: number; permission_id: number };
  app_roles: { id: number; key: string };
};
