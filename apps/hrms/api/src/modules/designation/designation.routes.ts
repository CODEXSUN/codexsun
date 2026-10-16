import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { DesignationRepository } from "./designation.repository.js";
import { DesignationService } from "./designation.service.js";
import type { DesignationContext, DesignationPermission } from "./designation.types.js";

const id = z.string().regex(/^[0-9a-f]{8}$/, "Designation ID is invalid.");
const params = z.object({ id });
const status = z.enum(["active", "inactive"]);
export const designationInputSchema = z
  .object({
    name: z.string().trim().min(1, "Designation name is required.").max(120),
    description: z.string().trim().max(500),
    status
  })
  .strict();
const record = designationInputSchema.extend({
  id,
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const activity = z.object({
  id: z.string(),
  action: z.string(),
  actorEmail: z.string(),
  summary: z.string(),
  createdAt: z.string()
});

export function registerDesignationRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<DesignationContext>
) {
  const scoped = async (request: FastifyRequest, permission: DesignationPermission) => {
    const scope = await context(request);
    await scope.authorize(permission);
    return {
      actor: scope.actorEmail,
      designations: new DesignationService(new DesignationRepository(scope.database))
    };
  };

  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/designations",
    schemas: {
      querystring: z.object({
        search: z.string().trim().max(180).optional(),
        status: z.enum(["all", "active", "inactive"]).default("all"),
        deleted: z.enum(["0", "1"]).default("0")
      }),
      response: z.array(record)
    },
    handler: async ({ request, query }) =>
      (await scoped(request, "hrms.designation.view")).designations.list({
        ...query,
        deleted: query.deleted === "1"
      })
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/designations/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) =>
      (await scoped(request, "hrms.designation.view")).designations.get(params.id)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/designations/:id/activity",
    schemas: { params, response: z.array(activity) },
    handler: async ({ request, params }) =>
      (await scoped(request, "hrms.designation.view")).designations.activity(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/designations",
    schemas: { body: designationInputSchema, response: record },
    handler: async ({ request, body }) => {
      const { designations, actor } = await scoped(request, "hrms.designation.create");
      return designations.create(body, actor);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/hrms/designations/:id",
    schemas: { params, body: designationInputSchema, response: record },
    handler: async ({ request, params, body }) => {
      const { designations, actor } = await scoped(request, "hrms.designation.update");
      return designations.update(params.id, body, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/designations/:id/status",
    schemas: { params, body: z.object({ status }), response: record },
    handler: async ({ request, params, body }) => {
      const { designations, actor } = await scoped(request, "hrms.designation.update");
      return designations.setStatus(params.id, body.status, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/designations/:id/restore",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { designations, actor } = await scoped(request, "hrms.designation.update");
      return designations.restore(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/hrms/designations/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { designations, actor } = await scoped(request, "hrms.designation.delete");
      return designations.remove(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/hrms/designations/:id/force",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { designations, actor } = await scoped(request, "hrms.designation.delete");
      return designations.forceDelete(params.id, actor);
    }
  });
}
