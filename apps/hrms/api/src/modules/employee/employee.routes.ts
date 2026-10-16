import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { EmployeeRepository } from "./employee.repository.js";
import { EmployeeService } from "./employee.service.js";
import type { EmployeeContext, EmployeePermission } from "./employee.types.js";

const status = z.enum(["active", "inactive"]);
const id = z.string().regex(/^[0-9a-f]{8}$/, "Employee ID is invalid.");
const params = z.object({ id });
export const employeeInputSchema = z
  .object({
    employeeCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z0-9][A-Z0-9_-]{0,39}$/,
        "Enter a code using letters, numbers, hyphens or underscores."
      ),
    name: z.string().trim().min(1, "Employee name is required.").max(180),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.union([z.literal(""), z.email()]))
      .pipe(z.string().max(180)),
    phone: z.string().trim().max(30),
    department: z.string().trim().max(120),
    designation: z.string().trim().max(120),
    joiningDate: z.iso.date().nullable(),
    userId: z.number().int().positive().nullable(),
    notes: z.string().trim().max(5000),
    status
  })
  .strict();
const record = employeeInputSchema.extend({
  id,
  userName: z.string().nullable(),
  userEmail: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const user = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string(),
  status: z.string()
});
const activity = z.object({
  id: z.string(),
  action: z.string(),
  actorEmail: z.string(),
  summary: z.string(),
  createdAt: z.string()
});

export function registerEmployeeRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<EmployeeContext>
) {
  const service = async (request: FastifyRequest, permission: EmployeePermission) => {
    const scope = await context(request);
    await scope.authorize(permission);
    return {
      actor: scope.actorEmail,
      employees: new EmployeeService(new EmployeeRepository(scope.database), scope.users)
    };
  };
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/employees",
    schemas: {
      querystring: z.object({
        search: z.string().trim().max(180).optional(),
        status: z.enum(["all", "active", "inactive"]).default("all"),
        deleted: z.enum(["0", "1"]).default("0")
      }),
      response: z.array(record)
    },
    handler: async ({ request, query }) =>
      (await service(request, "hrms.employee.view")).employees.list({
        ...query,
        deleted: query.deleted === "1"
      })
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/employees/users",
    schemas: { response: z.array(user) },
    handler: async ({ request }) =>
      (await service(request, "hrms.employee.view")).employees.userOptions()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/employees/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) =>
      (await service(request, "hrms.employee.view")).employees.get(params.id)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/hrms/employees/:id/activity",
    schemas: { params, response: z.array(activity) },
    handler: async ({ request, params }) =>
      (await service(request, "hrms.employee.view")).employees.activity(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/employees",
    schemas: { body: employeeInputSchema, response: record },
    handler: async ({ request, body }) => {
      const { employees, actor } = await service(request, "hrms.employee.create");
      return employees.create(body, actor);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/hrms/employees/:id",
    schemas: { body: employeeInputSchema, params, response: record },
    handler: async ({ request, body, params }) => {
      const { employees, actor } = await service(request, "hrms.employee.update");
      return employees.update(params.id, body, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/employees/:id/status",
    schemas: { body: z.object({ status }).strict(), params, response: record },
    handler: async ({ request, body, params }) => {
      const { employees, actor } = await service(request, "hrms.employee.update");
      return employees.setStatus(params.id, body.status, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/hrms/employees/:id/restore",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { employees, actor } = await service(request, "hrms.employee.update");
      return employees.restore(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/hrms/employees/:id",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { employees, actor } = await service(request, "hrms.employee.delete");
      return employees.remove(params.id, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/hrms/employees/:id/force",
    schemas: { params, response: record },
    handler: async ({ request, params }) => {
      const { employees, actor } = await service(request, "hrms.employee.delete");
      return employees.forceDelete(params.id, actor);
    }
  });
}
