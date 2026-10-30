import type { ColumnType, Generated, Kysely } from "kysely";

export const designationPermissions = [
  "hrms.designation.view",
  "hrms.designation.create",
  "hrms.designation.update",
  "hrms.designation.delete"
] as const;

export type DesignationPermission = (typeof designationPermissions)[number];
export type DesignationStatus = "active" | "inactive";
export type DesignationInput = {
  name: string;
  description: string;
  status: DesignationStatus;
};
export type DesignationRecord = DesignationInput & {
  id: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type DesignationActivity = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  createdAt: string;
};
export type DesignationFilters = {
  search?: string | undefined;
  status?: "all" | DesignationStatus | undefined;
  deleted?: boolean | undefined;
};

type Timestamp = ColumnType<Date | string, never, never>;
export type DesignationDatabase = {
  hrms_designations: {
    id: Generated<number>;
    uuid: string;
    name: string;
    description: string;
    status: DesignationStatus;
    created_at: Timestamp;
    updated_at: Timestamp;
    deleted_at: ColumnType<Date | string | null, never, string | null>;
  };
  hrms_designation_activity: {
    id: Generated<number>;
    uuid: string;
    designation_uuid: string;
    action: string;
    actor_email: string;
    summary: string;
    status: Generated<string>;
    created_at: Timestamp;
    updated_at: Timestamp;
  };
};
export type DesignationContext = {
  database: Kysely<DesignationDatabase>;
  actorEmail: string;
  authorize: (permission: DesignationPermission) => Promise<void>;
};
export type DesignationPermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; role_id: number; permission_id: number };
  app_roles: { id: number; key: string };
};
