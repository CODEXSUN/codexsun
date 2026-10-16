import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import type { CodexsunContextResolver } from "../../context.js";
import { RequirementsRepository } from "./requirements.repository.js";
import { RequirementsService } from "./requirements.service.js";

const path = "/codexsun/requirements";
const priority = z.enum(["low", "normal", "high", "urgent"]);
const status = z.enum(["draft", "awaiting_approval", "approved", "rejected"]);
const fields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
  priority
};
const record = z.object({
  ...fields,
  uuid: z.string(),
  origin: z.enum(["web", "desktop", "mobile"]),
  status,
  revision: z.number().int().positive(),
  decisionNote: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const params = z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/) }).strict();
const revision = z.number().int().positive();
const activity = z.object({
  uuid: z.string(),
  requirementUuid: z.string(),
  action: z.enum(["created", "updated", "submitted", "approved", "rejected"]),
  revision,
  note: z.string(),
  actorEmail: z.string(),
  createdAt: z.string()
});

export function registerRequirementsRoutes(app: FastifyInstance, context: CodexsunContextResolver) {
  async function service(request: FastifyRequest, action: string) {
    const scope = await context(request);
    await scope.authorize(`codexsun.requirements.${action}`);
    return new RequirementsService(
      new RequirementsRepository(scope.database),
      scope.actorEmail,
      await scope.can("codexsun.requirements.approve")
    );
  }
  async function change(
    request: FastifyRequest,
    action: string,
    work: () => Promise<z.infer<typeof record>>
  ) {
    const scope = await context(request);
    const result = await work();
    try {
      await scope.publishChange?.({
        tenantUuid: scope.tenantUuid,
        actorEmail: result.createdBy,
        resource: "requirements",
        uuid: result.uuid,
        revision: result.revision,
        action
      });
    } catch {
      request.log.warn("Realtime notification unavailable; requirement remains saved.");
    }
    return result;
  }
  registerContractRoute(app, {
    method: "GET",
    url: path,
    schemas: {
      querystring: z
        .object({
          page: z.coerce.number().int().min(1).max(100000).default(1),
          pageSize: z.coerce.number().int().min(1).max(100).default(20),
          search: z.string().trim().max(200).optional(),
          status: status.optional()
        })
        .strict(),
      response: z.object({
        records: z.array(record),
        total: z.number(),
        page: z.number(),
        pageSize: z.number()
      })
    },
    handler: async ({ request, query }) => (await service(request, "view")).list(query)
  });
  registerContractRoute(app, {
    method: "POST",
    url: path,
    schemas: {
      body: z
        .object({
          ...fields,
          clientKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
          origin: z.enum(["web", "desktop", "mobile"])
        })
        .strict(),
      response: record
    },
    handler: async ({ request, body }) =>
      change(request, "created", async () => (await service(request, "create")).create(body))
  });
  registerContractRoute(app, {
    method: "GET",
    url: path + "/:uuid",
    schemas: { params, response: record },
    handler: async ({ request, params }) => (await service(request, "view")).get(params.uuid)
  });
  registerContractRoute(app, {
    method: "PATCH",
    url: path + "/:uuid",
    schemas: { params, body: z.object({ ...fields, revision }).strict(), response: record },
    handler: async ({ request, params, body }) =>
      change(request, "updated", async () =>
        (await service(request, "update")).update(params.uuid, body)
      )
  });
  registerContractRoute(app, {
    method: "POST",
    url: path + "/:uuid/submit",
    schemas: { params, body: z.object({ revision }).strict(), response: record },
    handler: async ({ request, params, body }) =>
      change(request, "submitted", async () =>
        (await service(request, "update")).submit(params.uuid, body.revision)
      )
  });
  registerContractRoute(app, {
    method: "POST",
    url: path + "/:uuid/decision",
    schemas: {
      params,
      body: z
        .object({
          revision,
          decision: z.enum(["approved", "rejected"]),
          note: z.string().trim().max(2000)
        })
        .strict(),
      response: record
    },
    handler: async ({ request, params, body }) =>
      change(request, body.decision, async () =>
        (await service(request, "approve")).decision(
          params.uuid,
          body.revision,
          body.decision,
          body.note
        )
      )
  });
  registerContractRoute(app, {
    method: "GET",
    url: path + "/:uuid/activity",
    schemas: { params, response: z.array(activity) },
    handler: async ({ request, params }) => (await service(request, "view")).activity(params.uuid)
  });
}
