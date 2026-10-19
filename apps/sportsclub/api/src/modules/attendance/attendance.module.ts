import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerAttendanceRoutes } from "./attendance.routes.js";
import type { AttendanceService } from "./attendance.service.js";

export const attendanceModule = {
  key: "sportsclub.attendance",
  label: "Attendance",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<AttendanceService> | AttendanceService
  ) {
    return registerAttendanceRoutes(app, resolveService);
  }
};
