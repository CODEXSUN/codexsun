import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { DepartmentRepository } from "./department.repository.js";
import { DepartmentService } from "./department.service.js";
import type { DepartmentContext, DepartmentPermission } from "./department.types.js";

const id = z.string().regex(/^[0-9a-f]{8}$/, "Department ID is invalid.");
const params = z.object({ id });
const status = z.enum(["active", "inactive"]);
export const departmentInputSchema = z
  .object({
    name: z.string().trim().min(1, "Department name is required.").max(120),
    description: z.string().trim().max(500),
    status
  })
  .strict();
const record = departmentInputSchema.extend({
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

export function registerDepartmentRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<DepartmentContext>
) {
  const scoped = async (request: FastifyRequest, permission: DepartmentPermission) => {
    const scope = await context(request);
    await scope.authorize(permission);
    return {
      actor: scope.actorEmail,
      departments: new DepartmentService(new DepartmentRepository(scope.database))
    };
  };

  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/departments",
    schemas: {
      querystring: z.object({
        search: z.string().trim().max(180).optional(),
        status: z.enum(["all", "active", "inactive"]).default("all"),
        deleted: z.enum(["0", "1"]).default("0")
      }),
      response: z.array(record)
    },
    handler: async ({ request, query }) =>
      (await scoped(request, "hrms.department.view")).departments.list({
        ...query,
        deleted: query.deleted === "1"
      })
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/departments/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) =>
      (await scoped(request, "hrms.department.view")).departments.get(params.id)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/departments/:id/activity",
    schemas: { params, response: z.array(activity) },
    handler: async ({ request, params }) =>
      (await scoped(request, "hrms.department.view")).departments.activity(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/departments",
    schemas: { body: departmentInputSchema, response: record },
    handler: async ({ request, body }) => {
      const { departments, actor } = await scoped(request, "hrms.department.create");
      return departments.create(body, actor);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/hrms/departments/:id",
    schemas: { params, body: departmentInputSchema, response: record },
    handler: async ({ request, params, body }) => {
      const { departments, actor } = await scoped(request, "hrms.department.update");
      return departments.update(params.id, body, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/departments/:id/status",
    schemas: { params, body: z.object({ status }), response: record },
    handler: async ({ request, params, body }) => {
      const { departments, actor } = await scoped(request, "hrms.department.update");
      return departments.setStatus(params.id, body.status, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/departments/:id/restore",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { departments, actor } = await scoped(request, "hrms.department.update");
      return departments.restore(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/hrms/departments/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { departments, actor } = await scoped(request, "hrms.department.delete");
      return departments.remove(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/hrms/departments/:id/force",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { departments, actor } = await scoped(request, "hrms.department.delete");
      return departments.forceDelete(params.id, actor);
    }
  });
}
