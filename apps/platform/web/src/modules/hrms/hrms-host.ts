import { createHrmsOverviewGateway } from "@codexsun/hrms-web/modules/overview/gateway";
import { apiGet } from "../../shared/api/platform-api";
import { apiPost, apiPut, apiDelete } from "../../shared/api/platform-api";
import { createEmployeeGateway } from "@codexsun/hrms-web/modules/employee";
import { createAttendanceGateway } from "@codexsun/hrms-web/modules/attendance";
export const hrmsOverviewGateway = createHrmsOverviewGateway(<T>(path: string) =>
  apiGet<T>(path, "tenant")
);
export const employeeGateway = createEmployeeGateway({
  get: <T>(path: string) => apiGet<T>(path, "tenant"),
  post: <T>(path: string, input?: unknown) => apiPost<T>(path, input, "tenant"),
  put: <T>(path: string, input: unknown) => apiPut<T>(path, input, "tenant"),
  delete: <T>(path: string) => apiDelete<T>(path, "tenant")
});
export const attendanceGateway = createAttendanceGateway({
  get: <T>(path: string) => apiGet<T>(path, "tenant"),
  post: <T>(path: string, input: unknown) => apiPost<T>(path, input, "tenant"),
  put: <T>(path: string, input: unknown) => apiPut<T>(path, input, "tenant"),
  delete: <T>(path: string) => apiDelete<T>(path, "tenant")
});
