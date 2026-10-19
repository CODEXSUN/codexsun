import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { baseListQuerySchema, createListResponseSchema } from "../../sportsclub.pagination.js";
import type { MemberService } from "./member.service.js";
import {
  memberActivitySchema,
  memberListQuerySchema,
  memberListResponseSchema,
  memberPayloadSchema,
  memberPortalSchema,
  memberRecordSchema,
  studentEnrollmentSchema
} from "./member.schema.js";

import {
  SPORTSCLUB_PUBLIC_ENROLL_PATH,
  SPORTSCLUB_PUBLIC_REGISTRATION_PATH
} from "../../sportsclub.contracts.js";

export { SPORTSCLUB_PUBLIC_ENROLL_PATH, SPORTSCLUB_PUBLIC_REGISTRATION_PATH };

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Member UUID must be 8 hex characters.")
});

const progressUpdateSchema = z.strictObject({
  progressNote: z.string().trim().max(2000),
  revision: z.number().int().min(0)
});
const lookupQuerySchema = baseListQuerySchema.pick({ search: true, page: true });
const lookupResponseSchema = createListResponseSchema(memberRecordSchema.pick({
  uuid: true, name: true, role: true, status: true
}));

export function registerMemberRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<MemberService> | MemberService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/portal/me",
    schemas: { response: memberPortalSchema },
    handler: async ({ request, reply }) => {
      reply.header("Cache-Control", "no-store");
      return (await resolveService(request)).portal();
    }
  });

  registerContractRoute(app, {
    method: "POST",
    url: SPORTSCLUB_PUBLIC_ENROLL_PATH,
    schemas: { body: studentEnrollmentSchema, response: memberRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).enroll(body)
  });

  registerContractRoute(app, {
    method: "POST",
    url: SPORTSCLUB_PUBLIC_REGISTRATION_PATH,
    schemas: { body: studentEnrollmentSchema, response: memberRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).enroll(body)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/members",
    schemas: { querystring: memberListQuerySchema, response: memberListResponseSchema },
    handler: async ({ request, query }) => (await resolveService(request)).list(query)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/members/lookups",
    schemas: { querystring: lookupQuerySchema, response: lookupResponseSchema },
    handler: async ({ request, query }) => {
      const result = await (await resolveService(request)).list(query);
      return { ...result, items: result.items.map(({ uuid, name, role, status }) => ({ uuid, name, role, status })) };
    }
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/members/:uuid",
    schemas: { params: uuidParamsSchema, response: memberRecordSchema },
    handler: async ({ request, params }) => (await resolveService(request)).get(params.uuid)
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/members",
    schemas: { body: memberPayloadSchema, response: memberRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).save(null, body)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/members/:uuid",
    schemas: {
      params: uuidParamsSchema,
      body: memberPayloadSchema,
      response: memberRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).save(params.uuid, body)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/members/:uuid/progress",
    schemas: {
      params: uuidParamsSchema,
      body: progressUpdateSchema,
      response: memberRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).progress(params.uuid, body.progressNote, body.revision)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/members/:uuid/activity",
    schemas: { params: uuidParamsSchema, response: z.array(memberActivitySchema) },
    handler: async ({ request, params, reply }) => {
      reply.header("Cache-Control", "no-store");
      return (await resolveService(request)).activity(params.uuid);
    }
  });
}
