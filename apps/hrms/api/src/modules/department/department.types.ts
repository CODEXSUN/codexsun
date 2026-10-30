import type { ColumnType, Generated, Kysely } from "kysely";

export const departmentPermissions = [
  "hrms.department.view",
  "hrms.department.create",
  "hrms.department.update",
  "hrms.department.delete"
] as const;

export type DepartmentPermission = (typeof departmentPermissions)[number];
export type DepartmentStatus = "active" | "inactive";
export type DepartmentInput = {
  name: string;
  description: string;
  status: DepartmentStatus;
};
export type DepartmentRecord = DepartmentInput & {
  id: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type DepartmentActivity = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  createdAt: string;
};
export type DepartmentFilters = {
  search?: string | undefined;
  status?: "all" | DepartmentStatus | undefined;
  deleted?: boolean | undefined;
};

type Timestamp = ColumnType<Date | string, never, never>;
export type DepartmentDatabase = {
  hrms_departments: {
    id: Generated<number>;
    uuid: string;
    name: string;
    description: string;
    status: DepartmentStatus;
    created_at: Timestamp;
    updated_at: Timestamp;
    deleted_at: ColumnType<Date | string | null, never, string | null>;
  };
  hrms_department_activity: {
    id: Generated<number>;
    uuid: string;
    department_uuid: string;
    action: string;
    actor_email: string;
    summary: string;
    status: Generated<string>;
    created_at: Timestamp;
    updated_at: Timestamp;
  };
};
export type DepartmentContext = {
  database: Kysely<DepartmentDatabase>;
  actorEmail: string;
  authorize: (permission: DepartmentPermission) => Promise<void>;
};
export type DepartmentPermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; role_id: number; permission_id: number };
  app_roles: { id: number; key: string };
};
