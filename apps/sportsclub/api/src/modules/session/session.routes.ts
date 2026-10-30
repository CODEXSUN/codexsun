import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { baseListQuerySchema, createListResponseSchema } from "../../sportsclub.pagination.js";
import type { SessionService } from "./session.service.js";
import {
  publicSessionSchema,
  sessionListQuerySchema,
  sessionListResponseSchema,
  sessionPayloadSchema,
  sessionRecordSchema
} from "./session.schema.js";

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Session UUID must be 8 hex characters.")
});

const emptyResponseSchema = z.strictObject({
  success: z.boolean()
});
const lookupQuerySchema = baseListQuerySchema.pick({ search: true, page: true });
const lookupResponseSchema = createListResponseSchema(sessionRecordSchema.pick({
  uuid: true, title: true, daysOfWeek: true, startTime: true, endTime: true, venue: true, status: true
}));

export function registerSessionRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<SessionService> | SessionService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/public/sessions",
    schemas: { response: z.array(publicSessionSchema) },
    handler: async ({ request }) => (await resolveService(request)).listPublic()
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/sessions",
    schemas: { querystring: sessionListQuerySchema, response: sessionListResponseSchema },
    handler: async ({ request, query }) => (await resolveService(request)).list(query)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/sessions/lookups",
    schemas: { querystring: lookupQuerySchema, response: lookupResponseSchema },
    handler: async ({ request, query }) => {
      const result = await (await resolveService(request)).list(query);
      return { ...result, items: result.items.map(({ uuid, title, daysOfWeek, startTime, endTime, venue, status }) => ({ uuid, title, daysOfWeek, startTime, endTime, venue, status })) };
    }
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/sessions/:uuid",
    schemas: { params: uuidParamsSchema, response: sessionRecordSchema },
    handler: async ({ request, params }) => (await resolveService(request)).get(params.uuid)
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/sessions",
    schemas: { body: sessionPayloadSchema, response: sessionRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).create(body)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/sessions/:uuid",
    schemas: {
      params: uuidParamsSchema,
      body: sessionPayloadSchema,
      response: sessionRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).update(params.uuid, body)
  });

  registerContractRoute(app, {
    method: "DELETE",
    url: "/sportsclub/sessions/:uuid/force",
    schemas: { params: uuidParamsSchema, response: emptyResponseSchema },
    handler: async ({ request, params }) => {
      await (await resolveService(request)).delete(params.uuid);
      return { success: true };
    }
  });
}
