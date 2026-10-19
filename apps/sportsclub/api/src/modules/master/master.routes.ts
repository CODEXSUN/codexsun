import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { baseListQuerySchema, createListResponseSchema } from "../../sportsclub.pagination.js";
import type { MasterService } from "./master.service.js";
import {
  masterListQuerySchema,
  masterListResponseSchema,
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
const lookupQuerySchema = baseListQuerySchema.pick({ search: true, page: true });
const lookupResponseSchema = createListResponseSchema(masterRecordSchema.pick({
  uuid: true, name: true, title: true, primaryDiscipline: true, status: true
}));

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
    schemas: {
      querystring: masterListQuerySchema,
      response: masterListResponseSchema
    },
    handler: async ({ request, query }) => (await resolveService(request)).list(query)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/masters/lookups",
    schemas: { querystring: lookupQuerySchema, response: lookupResponseSchema },
    handler: async ({ request, query }) => {
      const result = await (await resolveService(request)).list(query);
      return { ...result, items: result.items.map(({ uuid, name, title, primaryDiscipline, status }) => ({ uuid, name, title, primaryDiscipline, status })) };
    }
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
