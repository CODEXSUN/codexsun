import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { ProgramService } from "./program.service.js";
import {
  programPayloadSchema,
  programRecordSchema,
  publicProgramSchema
} from "./program.schema.js";

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Program UUID must be 8 hex characters.")
});

const emptyResponseSchema = z.strictObject({
  success: z.boolean()
});

export function registerProgramRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<ProgramService> | ProgramService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/public/programs",
    schemas: { response: z.array(publicProgramSchema) },
    handler: async ({ request }) => (await resolveService(request)).listPublic()
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/programs",
    schemas: { response: z.array(programRecordSchema) },
    handler: async ({ request }) => (await resolveService(request)).list()
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/programs/:uuid",
    schemas: { params: uuidParamsSchema, response: programRecordSchema },
    handler: async ({ request, params }) => (await resolveService(request)).get(params.uuid)
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/programs",
    schemas: { body: programPayloadSchema, response: programRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).create(body)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/programs/:uuid",
    schemas: {
      params: uuidParamsSchema,
      body: programPayloadSchema,
      response: programRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).update(params.uuid, body)
  });

  registerContractRoute(app, {
    method: "DELETE",
    url: "/sportsclub/programs/:uuid/force",
    schemas: { params: uuidParamsSchema, response: emptyResponseSchema },
    handler: async ({ request, params }) => {
      await (await resolveService(request)).delete(params.uuid);
      return { success: true };
    }
  });
}
