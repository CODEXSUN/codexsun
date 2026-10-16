import type { AttendanceOverview } from "../attendance/attendance.types";

export type HrmsOverview = {
  actorEmail: string;
  appKey: "hrms";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
  attendance: AttendanceOverview;
};
