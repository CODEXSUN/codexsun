import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import {
  enquiryQuerySchema,
  enquiryListSchema,
  enquiryDetailSchema,
  enquiryChangeSchema
} from "./enquiry.schema.js";
import { withClientEnquiries } from "./enquiry.connection.js";
type Access = (
  request: FastifyRequest,
  uuid: string,
  action: "view" | "update" | "delete"
) => Promise<{ tenantId: string; actor: string }>;
export function registerEnquiryRoutes(app: FastifyInstance, access: Access) {
  const site = z.strictObject({ uuid: z.string().regex(/^[a-f0-9]{8}$/) });
  const item = site.extend({ reference: z.string().uuid() });
  const revision = z.strictObject({ revision: z.number().int().positive() });
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/:uuid/enquiries",
    schemas: { params: site, querystring: enquiryQuerySchema, response: enquiryListSchema },
    handler: async ({ request, reply, params, query }) => {
      const ctx = await access(request, params.uuid, "view");
      reply.header("Cache-Control", "no-store");
      return withClientEnquiries(ctx.tenantId, params.uuid, (repo) =>
        repo.list(enquiryQuerySchema.parse(query ?? {}))
      );
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/:uuid/enquiries/:reference",
    schemas: { params: item, response: enquiryDetailSchema },
    handler: async ({ request, reply, params }) => {
      const ctx = await access(request, params.uuid, "view");
      reply.header("Cache-Control", "no-store");
      return withClientEnquiries(ctx.tenantId, params.uuid, (repo) => repo.show(params.reference));
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/sites/:uuid/enquiries/:reference/status",
    schemas: { params: item, body: enquiryChangeSchema, response: enquiryDetailSchema },
    handler: async ({ request, params, body }) => {
      const ctx = await access(request, params.uuid, "update");
      return withClientEnquiries(ctx.tenantId, params.uuid, (repo) =>
        repo.change(params.reference, body.revision, "status", ctx.actor, body.status)
      );
    }
  });
  for (const action of ["delete", "restore"] as const)
    registerContractRoute(app, {
      method: "POST",
      url: `/sites/:uuid/enquiries/:reference/${action}`,
      schemas: { params: item, body: revision, response: enquiryDetailSchema },
      handler: async ({ request, params, body }) => {
        const ctx = await access(request, params.uuid, "delete");
        return withClientEnquiries(ctx.tenantId, params.uuid, (repo) =>
          repo.change(params.reference, body.revision, action, ctx.actor)
        );
      }
    });
}
