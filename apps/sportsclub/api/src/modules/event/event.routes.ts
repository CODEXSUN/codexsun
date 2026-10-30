import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { EventService } from "./event.service.js";
import {
  eventListQuerySchema,
  eventListResponseSchema,
  eventPayloadSchema,
  eventRecordSchema,
  publicEventSchema
} from "./event.schema.js";

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Event UUID must be 8 hex characters.")
});

const emptyResponseSchema = z.strictObject({
  success: z.boolean()
});

export function registerEventRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<EventService> | EventService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/public/events",
    schemas: { response: z.array(publicEventSchema) },
    handler: async ({ request }) => (await resolveService(request)).listPublic()
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/events",
    schemas: {
      querystring: eventListQuerySchema,
      response: eventListResponseSchema
    },
    handler: async ({ request, query }) => (await resolveService(request)).list(query)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/events/:uuid",
    schemas: { params: uuidParamsSchema, response: eventRecordSchema },
    handler: async ({ request, params }) => (await resolveService(request)).get(params.uuid)
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/events",
    schemas: { body: eventPayloadSchema, response: eventRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).create(body)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/events/:uuid",
    schemas: {
      params: uuidParamsSchema,
      body: eventPayloadSchema,
      response: eventRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).update(params.uuid, body)
  });

  registerContractRoute(app, {
    method: "DELETE",
    url: "/sportsclub/events/:uuid/force",
    schemas: { params: uuidParamsSchema, response: emptyResponseSchema },
    handler: async ({ request, params }) => {
      await (await resolveService(request)).delete(params.uuid);
      return { success: true };
    }
  });
}
