import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { SessionService } from "./session.service.js";
import {
  publicSessionSchema,
  sessionPayloadSchema,
  sessionRecordSchema
} from "./session.schema.js";

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Session UUID must be 8 hex characters.")
});

const emptyResponseSchema = z.strictObject({
  success: z.boolean()
});

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
    schemas: { response: z.array(sessionRecordSchema) },
    handler: async ({ request }) => (await resolveService(request)).list()
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
