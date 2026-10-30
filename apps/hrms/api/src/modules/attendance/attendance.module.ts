import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerAttendanceRoutes } from "./attendance.routes.js";
import type { AttendanceContext } from "./attendance.types.js";

export const attendanceModule = {
  // Synchronous tenant operations: no event bus, background jobs, or offline sync.
  capabilities: { events: false, worker: false, sync: false },
  key: "hrms.attendance",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<AttendanceContext>
  ) => registerAttendanceRoutes(app, context)
};
