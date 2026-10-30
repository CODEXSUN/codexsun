import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { AttendanceRepository } from "./attendance.repository.js";
import { AttendanceService } from "./attendance.service.js";
import type { AttendanceContext, AttendancePermission } from "./attendance.types.js";

const uuid = z.string().regex(/^[0-9a-f]{8}$/);
const params = z.object({ id: uuid });
const status = z.enum(["present", "absent", "leave", "holiday"]);
export const attendanceInputSchema = z
  .object({
    employeeId: uuid,
    workDate: z.iso.date(),
    status,
    checkIn: z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]).nullable(),
    checkOut: z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]).nullable(),
    notes: z.string().trim().max(2000)
  })
  .strict();
const record = attendanceInputSchema.extend({
  id: uuid,
  employeeCode: z.string(),
  employeeName: z.string(),
  department: z.string(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const employee = z.object({
  id: uuid,
  employeeCode: z.string(),
  name: z.string(),
  department: z.string()
});
const recent = z.object({
  id: uuid,
  employeeCode: z.string(),
  employeeName: z.string(),
  workDate: z.iso.date(),
  status,
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable()
});
export const attendanceOverviewSchema = z.object({
  activeEmployees: z.number(),
  markedToday: z.number(),
  presentToday: z.number(),
  absentToday: z.number(),
  leaveToday: z.number(),
  holidayToday: z.number(),
  notMarkedToday: z.number(),
  attendanceRate: z.number(),
  today: z.iso.date(),
  week: z.array(
    z.object({
      date: z.iso.date(),
      present: z.number(),
      absent: z.number(),
      leave: z.number(),
      holiday: z.number()
    })
  ),
  recent: z.array(recent)
});

export function registerAttendanceRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<AttendanceContext>
) {
  const scoped = async (request: FastifyRequest, permission: AttendancePermission) => {
    const scope = await context(request);
    await scope.authorize(permission);
    return {
      scope,
      actor: scope.actorEmail,
      service: new AttendanceService(new AttendanceRepository(scope.database))
    };
  };
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/attendance",
    schemas: {
      querystring: z.object({
        date: z.iso.date().optional(),
        search: z.string().trim().max(180).optional(),
        status: z.enum(["all", "present", "absent", "leave", "holiday"]).default("all")
      }),
      response: z.array(record)
    },
    handler: async ({ request, query }) =>
      (await scoped(request, "hrms.attendance.view")).service.list(query)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/attendance/employees",
    schemas: { response: z.array(employee) },
    handler: async ({ request }) =>
      (await scoped(request, "hrms.attendance.view")).service.employees()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/attendance/overview",
    schemas: { response: attendanceOverviewSchema },
    handler: async ({ request }) =>
      (await scoped(request, "hrms.attendance.view")).service.overview()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/attendance/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) =>
      (await scoped(request, "hrms.attendance.view")).service.get(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/attendance",
    schemas: { body: attendanceInputSchema, response: record },
    handler: async ({ request, body }) => {
      const { service, actor } = await scoped(request, "hrms.attendance.create");
      return service.create(body, actor);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/hrms/attendance/:id",
    schemas: { params, body: attendanceInputSchema, response: record },
    handler: async ({ request, params, body }) => {
      const { service, actor } = await scoped(request, "hrms.attendance.update");
      return service.update(params.id, body, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/hrms/attendance/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { service, actor } = await scoped(request, "hrms.attendance.delete");
      return service.remove(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/attendance/:id/restore",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { service, actor } = await scoped(request, "hrms.attendance.update");
      return service.restore(params.id, actor);
    }
  });
}
