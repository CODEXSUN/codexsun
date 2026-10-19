import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { AttendanceService } from "./attendance.service.js";
import {
  attendancePayloadSchema,
  attendanceRecordSchema
} from "./attendance.schema.js";

const sessionParamsSchema = z.strictObject({
  sessionUuid: z.string().regex(/^[a-f0-9]{8}$/, "Session UUID must be 8 hex characters.")
});

const queryDateSchema = z.strictObject({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export function registerAttendanceRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<AttendanceService> | AttendanceService
) {
  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/attendance",
    schemas: { body: attendancePayloadSchema, response: attendanceRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).record(body)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/attendance/me",
    schemas: { response: z.array(attendanceRecordSchema) },
    handler: async ({ request, reply }) => {
      reply.header("Cache-Control", "no-store");
      return (await resolveService(request)).listMyAttendance();
    }
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/attendance/session/:sessionUuid",
    schemas: {
      params: sessionParamsSchema,
      querystring: queryDateSchema,
      response: z.array(attendanceRecordSchema)
    },
    handler: async ({ request, params, query }) =>
      (await resolveService(request)).listForSession(params.sessionUuid, query?.date)
  });
}
