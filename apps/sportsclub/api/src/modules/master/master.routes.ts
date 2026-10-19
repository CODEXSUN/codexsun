import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { MasterService } from "./master.service.js";
import {
  masterPayloadSchema,
  masterRecordSchema,
  publicMasterSchema
} from "./master.schema.js";

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Master UUID must be 8 hex characters.")
});

const emptyResponseSchema = z.strictObject({
  success: z.boolean()
});

export function registerMasterRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<MasterService> | MasterService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/public/masters",
    schemas: { response: z.array(publicMasterSchema) },
    handler: async ({ request }) => (await resolveService(request)).listPublic()
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/masters",
    schemas: { response: z.array(masterRecordSchema) },
    handler: async ({ request }) => (await resolveService(request)).list()
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/masters/:uuid",
    schemas: { params: uuidParamsSchema, response: masterRecordSchema },
    handler: async ({ request, params }) => (await resolveService(request)).get(params.uuid)
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/masters",
    schemas: { body: masterPayloadSchema, response: masterRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).create(body)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/masters/:uuid",
    schemas: {
      params: uuidParamsSchema,
      body: masterPayloadSchema,
      response: masterRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).update(params.uuid, body)
  });

  registerContractRoute(app, {
    method: "DELETE",
    url: "/sportsclub/masters/:uuid/force",
    schemas: { params: uuidParamsSchema, response: emptyResponseSchema },
    handler: async ({ request, params }) => {
      await (await resolveService(request)).delete(params.uuid);
      return { success: true };
    }
  });
}
