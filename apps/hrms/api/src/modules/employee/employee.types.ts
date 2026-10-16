import type { ColumnType, Generated, Kysely } from "kysely";

export const employeePermissions = [
  "hrms.employee.view",
  "hrms.employee.create",
  "hrms.employee.update",
  "hrms.employee.delete"
] as const;
export type EmployeePermission = (typeof employeePermissions)[number];
export type EmployeeStatus = "active" | "inactive";
export type EmployeeInput = {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string | null;
  userId: number | null;
  notes: string;
  status: EmployeeStatus;
};
export type EmployeeRecord = EmployeeInput & {
  id: string;
  userName: string | null;
  userEmail: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type EmployeeUserOption = { id: number; name: string; email: string; status: string };
export type EmployeeActivity = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  createdAt: string;
};
export type EmployeeFilters = {
  search?: string | undefined;
  status?: "all" | EmployeeStatus | undefined;
  deleted?: boolean | undefined;
};
type Timestamp = ColumnType<Date | string, never, never>;
type EmployeeRow = {
  id: Generated<number>;
  uuid: string;
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joining_date: ColumnType<Date | string | null, string | null, string | null>;
  user_id: number | null;
  notes: string;
  status: EmployeeStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: ColumnType<Date | string | null, never, string | null>;
};
export type EmployeeDatabase = {
  hrms_employees: EmployeeRow;
  hrms_employee_activity: {
    id: Generated<number>;
    uuid: string;
    employee_uuid: string;
    action: string;
    actor_email: string;
    summary: string;
    status: Generated<string>;
    created_at: Timestamp;
    updated_at: Timestamp;
  };
};
export type EmployeeContext = {
  database: Kysely<EmployeeDatabase>;
  actorEmail: string;
  authorize: (permission: EmployeePermission) => Promise<void>;
  users: {
    list: () => Promise<EmployeeUserOption[]>;
    find: (id: number) => Promise<EmployeeUserOption | null>;
  };
};
export type EmployeePermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; role_id: number; permission_id: number };
  app_roles: { id: number; key: string };
};
