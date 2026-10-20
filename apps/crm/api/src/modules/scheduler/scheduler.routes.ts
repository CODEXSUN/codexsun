import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { SchedulerRepository } from "./scheduler.repository.js";
import { SchedulerService } from "./scheduler.service.js";
import { scheduleSourceTypes } from "./scheduler.types.js";
import type { ScheduleRecord, SchedulerContext } from "./scheduler.types.js";

const idParams = z.object({ id: z.coerce.number().int().positive() });
const row = z.object({
  id: z.number(),
  uuid: z.string(),
  title: z.string(),
  details: z.string(),
  sourceType: z.enum(scheduleSourceTypes),
  sourceId: z.number(),
  sourceLabel: z.string(),
  scheduledAt: z.string(),
  reminderAt: z.string(),
  acknowledgedAt: z.string().nullable(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  assignedUserId: z.number(),
  assignedTo: z.string(),
  createdBy: z.string(),
  createdAt: z.string()
});

export function registerSchedulerRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<SchedulerContext>
) {
  const service = async (request: FastifyRequest) => {
    const scope = await context(request);
    return new SchedulerService(new SchedulerRepository(scope.database), scope);
  };
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/schedules",
    schemas: {
      querystring: z.object({
        view: z.enum(["schedules", "reminders"]).default("schedules"),
        sourceType: z.enum(scheduleSourceTypes).optional(),
        sourceId: z.coerce.number().int().positive().optional()
      }),
      response: z.array(row)
    },
    handler: async ({ query, request }) =>
      (await service(request)).list(query.view, query.sourceType, query.sourceId)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/schedules/reminders",
    schemas: { response: z.array(row) },
    handler: async ({ request }) => (await service(request)).reminders()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/schedules/sources",
    schemas: {
      querystring: z.object({
        sourceType: z.enum(scheduleSourceTypes),
        search: z.string().trim().max(191).default("")
      }),
      response: z.array(z.object({ id: z.number(), label: z.string() }))
    },
    handler: async ({ query, request }) =>
      (await service(request)).sources(query.sourceType, query.search)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/schedules",
    schemas: {
      body: z.object({
        title: z.string().trim().min(1).max(191),
        details: z.string().trim().max(10000).default(""),
        sourceType: z.enum(scheduleSourceTypes),
        sourceId: z.number().int().positive(),
        scheduledAt: z.iso.datetime({ offset: true }),
        reminderAt: z.iso.datetime({ offset: true })
      }),
      response: row
    },
    handler: async ({ body, request }) => (await service(request)).create(body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/schedules/:id/acknowledge",
    schemas: { params: idParams, response: row },
    handler: async ({ params, request }) => (await service(request)).acknowledge(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/schedules/:id/status",
    schemas: {
      params: idParams,
      body: z.object({ status: z.enum(["completed", "cancelled"]) }),
      response: row
    },
    handler: async ({ params, body, request }) =>
      (await service(request)).updateStatus(params.id, body.status)
  });
}

export const scheduleRecordSchema = row satisfies z.ZodType<ScheduleRecord>;
