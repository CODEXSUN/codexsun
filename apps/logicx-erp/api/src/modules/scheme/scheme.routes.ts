import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { LogicxErpSchemeRepository } from "./scheme.repository.js";
import { LogicxErpSchemeService } from "./scheme.service.js";
import {
  logicxErpSchemePriorities,
  logicxErpSchemeStatuses,
  type LogicxErpSchemePermission,
  type LogicxErpSchemeRequestContext
} from "./scheme.types.js";

const publicId = z.string().regex(/^[0-9a-f]{8}$/, "Scheme ID is invalid.");
const priority = z.enum(logicxErpSchemePriorities);
const status = z.enum(logicxErpSchemeStatuses);
const wholeAmount = z.number().int().min(0).max(2_000_000_000);

const inputSchema = z
  .object({
    schemeDate: z.iso.date("Scheme date must be a valid date."),
    salesId: z.string().regex(/^[0-9a-f]{8}$/, "Select a sales invoice."),
    priority,
    supportValue: wholeAmount,
    brandId: z.number().int().positive("Select a brand."),
    description: z.string().trim().min(1, "Scheme description is required.").max(255),
    requestedByUserId: z.number().int().positive("Select the requesting user."),
    approvedByUserId: z.number().int().positive().nullable(),
    claimDone: z.boolean(),
    amountRealized: wholeAmount.nullable(),
    status
  })
  .strict();
const recordSchema = inputSchema.extend({
  id: publicId,
  schemeNo: z.string(),
  invoiceNumber: z.string(),
  brandName: z.string(),
  requestedByName: z.string(),
  approvedByName: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const listQuerySchema = z.object({
  search: z.string().trim().max(191).optional(),
  status: z.enum(["all", ...logicxErpSchemeStatuses]).default("all"),
  priority: z.enum(["all", ...logicxErpSchemePriorities]).default("all"),
  claim: z.enum(["all", "done", "pending"]).default("all")
});
const idParamsSchema = z.object({ id: publicId });
const activitySchema = z.object({
  id: z.string(),
  action: z.enum(["created", "updated", "activated", "deactivated", "deleted"]),
  summary: z.string(),
  actorEmail: z.string(),
  createdAt: z.string()
});
const lookupsSchema = z.object({
  brands: z.array(z.object({ id: z.number().int().positive(), name: z.string() })),
  users: z.array(z.object({ id: z.number().int().positive(), name: z.string(), email: z.string() }))
});
const invoiceOptionSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  issuedOn: z.string(),
  customerName: z.string(),
  amount: z.number()
});

export function registerLogicxErpSchemeRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<LogicxErpSchemeRequestContext>
) {
  const service = async (request: FastifyRequest, permission: LogicxErpSchemePermission) => {
    const scope = await context(request);
    await scope.authorize(permission);
    return {
      actor: scope.actorEmail,
      schemes: new LogicxErpSchemeService(new LogicxErpSchemeRepository(scope.database))
    };
  };

  registerContractRoute(app, {
    method: "GET",
    url: "/logicx-erp/schemes",
    schemas: { querystring: listQuerySchema, response: z.array(recordSchema) },
    handler: async ({ query, request }) =>
      (await service(request, "logicx-erp.scheme.view")).schemes.list(query)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/logicx-erp/schemes/lookups",
    schemas: { response: lookupsSchema },
    handler: async ({ request }) =>
      (await service(request, "logicx-erp.scheme.view")).schemes.lookups()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/logicx-erp/schemes/lookups/invoices",
    schemas: {
      querystring: z.object({ search: z.string().trim().max(191).default("") }),
      response: z.array(invoiceOptionSchema)
    },
    handler: async ({ query, request }) =>
      (await service(request, "logicx-erp.scheme.view")).schemes.invoiceOptions(query.search)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/logicx-erp/schemes/:id",
    schemas: { params: idParamsSchema, response: recordSchema },
    handler: async ({ params, request }) =>
      (await service(request, "logicx-erp.scheme.view")).schemes.get(params.id)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/logicx-erp/schemes/:id/activity",
    schemas: { params: idParamsSchema, response: z.array(activitySchema) },
    handler: async ({ params, request }) =>
      (await service(request, "logicx-erp.scheme.view")).schemes.activity(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/logicx-erp/schemes",
    schemas: { body: inputSchema, response: recordSchema },
    handler: async ({ body, request }) => {
      const { actor, schemes } = await service(request, "logicx-erp.scheme.create");
      return schemes.create(body, actor);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/logicx-erp/schemes/:id",
    schemas: { body: inputSchema, params: idParamsSchema, response: recordSchema },
    handler: async ({ body, params, request }) => {
      const { actor, schemes } = await service(request, "logicx-erp.scheme.update");
      return schemes.update(params.id, body, actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/logicx-erp/schemes/:id/status",
    schemas: {
      body: z.object({ status }).strict(),
      params: idParamsSchema,
      response: recordSchema
    },
    handler: async ({ body, params, request }) => {
      const { actor, schemes } = await service(request, "logicx-erp.scheme.update");
      return schemes.setStatus(params.id, body.status, actor);
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/logicx-erp/schemes/:id",
    schemas: { params: idParamsSchema, response: recordSchema },
    handler: async ({ params, request }) => {
      const { actor, schemes } = await service(request, "logicx-erp.scheme.delete");
      return schemes.remove(params.id, actor);
    }
  });
}
