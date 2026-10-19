import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { ProgressService } from "./progress.service.js";
import {
  progressEvaluationInputSchema,
  progressListQuerySchema,
  progressListResponseSchema,
  progressRecordSchema,
  studentProgressViewSchema
} from "./progress.schema.js";

const memberParamsSchema = z.strictObject({
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/, "Member UUID must be 8 hex characters.")
});

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Progress UUID must be 8 hex characters.")
});

export function registerProgressRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<ProgressService> | ProgressService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/progress",
    schemas: {
      querystring: progressListQuerySchema,
      response: progressListResponseSchema
    },
    handler: async ({ request, query }) => (await resolveService(request)).list(query)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/progress/:uuid",
    schemas: { params: uuidParamsSchema, response: progressRecordSchema },
    handler: async ({ request, params }) => (await resolveService(request)).get(params.uuid)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/progress/member/:memberUuid",
    schemas: {
      params: memberParamsSchema,
      response: z.array(z.union([progressRecordSchema, studentProgressViewSchema]))
    },
    handler: async ({ request, params, reply }) => {
      reply.header("Cache-Control", "no-store");
      return (await resolveService(request)).listForMember(params.memberUuid);
    }
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/progress/member/:memberUuid",
    schemas: {
      params: memberParamsSchema,
      body: progressEvaluationInputSchema,
      response: progressRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).evaluate(params.memberUuid, body)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/progress/:uuid",
    schemas: {
      params: uuidParamsSchema,
      body: progressEvaluationInputSchema,
      response: progressRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).update(params.uuid, body)
  });
}
