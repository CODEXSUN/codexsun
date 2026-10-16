export const hrmsOverviewPermissions = ["hrms.overview.view"] as const;
export type HrmsOverviewPermission = (typeof hrmsOverviewPermissions)[number];

export type HrmsOverview = {
  actorEmail: string;
  appKey: "hrms";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
  attendance: AttendanceOverview;
};

export type HrmsOverviewRequestContext = {
  actorEmail: string;
  authorize: (permission: HrmsOverviewPermission) => Promise<void>;
  tenant: { code: string; name: string };
  database: Kysely<AttendanceDatabase>;
};

// Tenant runtime tables written by the permission seed.
export type HrmsPermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; permission_id: number; role_id: number };
  app_roles: { id: number; key: string };
};
import type { Kysely } from "kysely";
import type { AttendanceDatabase, AttendanceOverview } from "../attendance/attendance.types.js";
