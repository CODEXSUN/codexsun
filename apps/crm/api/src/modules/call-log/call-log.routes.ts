import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { CallLogService, callStatuses, callTypes } from "./call-log.service.js";
import type { CallLogContext } from "./call-log.types.js";
import { CallLogRepository } from "./call-log.repository.js";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
  search: z.string().trim().max(100).default(""),
  type: z.union([z.enum(callTypes), z.literal("")]).default(""),
  status: z.union([z.enum(callStatuses), z.literal("")]).default("")
});
const inputSchema = z.object({
  type: z.enum(callTypes),
  from: z.string().trim().min(1).max(80),
  to: z.string().trim().min(1).max(80),
  status: z.enum(callStatuses),
  duration: z.number().int().min(0).max(86400),
  user: z.string().trim().max(140).nullable(),
  sourceReference: z.string().trim().min(1).max(191).nullable().optional(),
  occurredAt: z.iso.datetime().nullable().optional()
});
const nameParams = z.object({ name: z.string().regex(/^CL-\d+$/u) });
const commentInputSchema = z.object({ body: z.string().trim().min(1).max(10000) });
const commentSchema = z.object({
  id: z.number().int().positive(),
  callLogId: z.number().int().positive(),
  body: z.string(),
  createdBy: z.string(),
  createdAt: z.string()
});
const recordSchema = z.object({
  name: z.string(),
  from: z.string(),
  to: z.string(),
  type: z.string(),
  status: z.string(),
  duration: z.number(),
  receiver: z.string(),
  caller: z.string(),
  createdAt: z.string(),
  startedAt: z.string()
});

export function registerCallLogRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<CallLogContext>
) {
  const service = async (request: FastifyRequest) => {
    const scope = await context(request);
    return new CallLogService(new CallLogRepository(scope.database), scope.actorEmail);
  };
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/call-logs",
    schemas: {
      querystring: querySchema,
      response: z.object({
        items: z.array(recordSchema),
        page: z.number(),
        pageSize: z.number(),
        hasMore: z.boolean(),
        total: z.number().int().nonnegative(),
        statusCounts: z.array(z.object({ code: z.string(), count: z.number().int().nonnegative() }))
      })
    },
    handler: async ({ query, request }) => (await service(request)).list(query)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/call-logs/options",
    schemas: { response: z.object({ types: z.array(z.string()), statuses: z.array(z.string()) }) },
    handler: async ({ request }) => {
      await context(request);
      return { types: [...callTypes], statuses: [...callStatuses] };
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/call-logs/users",
    schemas: {
      querystring: z.object({ search: z.string().trim().max(100).default("") }),
      response: z.array(z.object({ value: z.string(), label: z.string() }))
    },
    handler: async ({ query, request }) => (await service(request)).users(query.search)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/call-logs",
    schemas: { body: inputSchema, response: z.object({ name: z.string() }) },
    handler: async ({ body, request }) => (await service(request)).create(body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/mobile/call-logs",
    schemas: { body: inputSchema, response: z.object({ name: z.string() }) },
    handler: async ({ body, request }) => (await service(request)).create(body)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/call-logs/:name/comments",
    schemas: { params: nameParams, response: z.array(commentSchema) },
    handler: async ({ params, request }) =>
      (await service(request)).listComments(callLogId(params.name))
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/mobile/call-logs/:name/comments",
    schemas: { params: nameParams, body: commentInputSchema, response: commentSchema },
    handler: async ({ params, body, request }) =>
      (await service(request)).addComment(callLogId(params.name), body.body)
  });
}

function callLogId(name: string) {
  return Number(name.slice(3));
}
