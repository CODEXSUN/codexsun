import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { StorefrontAnnouncementService } from "./storefront-announcement.service.js";

const service = new StorefrontAnnouncementService();
const status = z.enum(["active", "inactive"]);
const payload = z.object({
  displayDurationMs: z.number().int().min(3000).max(60000).default(12000),
  endsAt: z.string().datetime().nullable().default(null),
  message: z.string().trim().min(1).max(500),
  startsAt: z.string().datetime().optional(),
  status: status.default("active")
});
const record = z.object({
  createdAt: z.string(),
  displayDurationMs: z.number().int(),
  endsAt: z.string().nullable(),
  eventKey: z.string(),
  id: z.number().int().positive(),
  message: z.string(),
  startsAt: z.string(),
  status,
  updatedAt: z.string()
});
const params = z.object({ id: z.coerce.number().int().positive() });

export async function registerStorefrontAnnouncementPublicRoutes(app: FastifyInstance) {
  registerContractRoute(app, {
    handler: () => service.active(),
    method: "GET",
    schemas: { response: record.nullable() },
    url: "/storefront/announcement"
  });
}

export async function registerStorefrontAnnouncementRoutes(app: FastifyInstance) {
  const base = "/ecommerce/storefront/announcements";
  registerContractRoute(app, {
    handler: () => service.list(),
    method: "GET",
    schemas: { response: z.array(record) },
    url: base
  });
  registerContractRoute(app, {
    handler: ({ body }) => service.trigger(body),
    method: "POST",
    schemas: { body: payload, response: record },
    url: base
  });
  registerContractRoute(app, {
    handler: ({ body, params: routeParams }) => service.update(routeParams.id, body),
    method: "PUT",
    schemas: { body: payload, params, response: record },
    url: `${base}/:id`
  });
  for (const [action, active] of [
    ["activate", true],
    ["deactivate", false]
  ] as const)
    registerContractRoute(app, {
      handler: ({ params: routeParams }) => service.setActive(routeParams.id, active),
      method: "POST",
      schemas: { params, response: record },
      url: `${base}/:id/${action}`
    });
  registerContractRoute(app, {
    handler: ({ params: routeParams }) => service.forceDelete(routeParams.id),
    method: "DELETE",
    schemas: { params, response: record },
    url: `${base}/:id/force`
  });
}
