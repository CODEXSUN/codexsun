import { registerContractRoute } from "@codexsun/framework/http";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { z } from "zod";
import { SiteRepository } from "./site.repository.js";
import { SiteService } from "./site.service.js";
import type { SitesDatabase, SitesRequestContext } from "./site.types.js";

const siteStatusSchema = z.enum(["active", "draft", "suspended"]);

const siteResponseSchema = z.strictObject({
  createdAt: z.string(),
  description: z.string(),
  id: z.number().int(),
  name: z.string(),
  port: z.number().int(),
  primaryDomain: z.string(),
  publishedPages: z.number().int(),
  slug: z.string(),
  status: siteStatusSchema,
  themeKey: z.string(),
  updatedAt: z.string(),
  uuid: z.string().length(8)
});

const sitePayloadSchema = z.strictObject({
  description: z.string().max(255).optional(),
  name: z.string().min(1).max(160),
  port: z.number().int().min(0).max(65535).optional(),
  primaryDomain: z.string().min(1).max(255),
  slug: z.string().min(1).max(120),
  themeKey: z.string().min(1).max(120)
});

const siteParamsSchema = z.strictObject({
  uuid: z.string().length(8)
});

export function registerSiteRoutes(
  app: FastifyInstance,
  resolveContext: (request: FastifyRequest) => SitesRequestContext | Promise<SitesRequestContext>
) {
  async function getService(request: FastifyRequest) {
    const ctx = await resolveContext(request);
    const db = ctx.database as Kysely<SitesDatabase>;
    return new SiteService(new SiteRepository(db));
  }

  registerContractRoute(app, {
    handler: async ({ request }) => (await getService(request)).list(),
    method: "GET",
    schemas: { response: z.array(siteResponseSchema) },
    url: "/sites"
  });

  registerContractRoute(app, {
    handler: async ({ body, request }) => (await getService(request)).create(body),
    method: "POST",
    schemas: { body: sitePayloadSchema, response: siteResponseSchema },
    url: "/sites"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).show(params.uuid),
    method: "GET",
    schemas: { params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid"
  });

  registerContractRoute(app, {
    handler: async ({ body, params, request }) => (await getService(request)).update(params.uuid, body),
    method: "PUT",
    schemas: { body: sitePayloadSchema, params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).suspend(params.uuid),
    method: "POST",
    schemas: { params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid/suspend"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).restore(params.uuid),
    method: "POST",
    schemas: { params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid/restore"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).delete(params.uuid),
    method: "DELETE",
    schemas: {
      params: siteParamsSchema,
      response: z.strictObject({ deleted: z.boolean(), uuid: z.string().length(8) })
    },
    url: "/sites/:uuid"
  });
}
