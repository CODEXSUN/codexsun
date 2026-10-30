import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { FeaturedCardService } from "./featured-card.service.js";

const base = "/ecommerce/storefront/featured-cards";
const params = z.object({ id: z.coerce.number().int().positive() });
const status = z.enum(["active", "inactive"]);
const payload = z.object({
  actionLabel: z.string().trim().max(120).default(""),
  actionUrl: z.string().trim().max(1000).default(""),
  badge: z.string().trim().max(120).default(""),
  badgePosition: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
    .default("top-right"),
  badgeTint: z.string().trim().min(1).max(32).default("#0f766e"),
  badgeTextColor: z.string().trim().min(1).max(32).default("#ffffff"),
  description: z.string().trim().max(500).default(""),
  displayOrder: z.number().int().min(0).default(0),
  endsAt: z.iso.datetime().nullable().default(null),
  eyebrow: z.string().trim().max(191).default(""),
  imageUrl: z.string().trim().max(1000).default(""),
  ishopItem: z.string().trim().max(191).nullable().default(null),
  offerPrice: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().nullable().default(null),
  published: z.boolean().default(false),
  featuredCode: z.string().trim().min(1).max(191),
  startsAt: z.iso.datetime().nullable().default(null),
  status: status.default("active"),
  title: z.string().trim().min(1).max(191)
});
const record = payload.extend({
  createdAt: z.string(),
  frappeDocumentName: z.string(),
  frappeModifiedAt: z.string().nullable(),
  id: z.number(),
  updatedAt: z.string(),
  uuid: z.string().length(8)
});
export async function registerFeaturedCardRoutes(app: FastifyInstance) {
  const service = new FeaturedCardService();
  registerContractRoute(app, {
    method: "GET",
    url: base,
    schemas: {
      querystring: z.object({ search: z.string().optional(), status: status.optional() }),
      response: z.array(record)
    },
    handler: ({ query }) =>
      service.list({
        ...(query.search === undefined ? {} : { search: query.search }),
        ...(query.status === undefined ? {} : { status: query.status })
      })
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${base}/:id`,
    schemas: { params, response: record },
    handler: async ({ params: value }) => required(await service.find(value.id))
  });
  registerContractRoute(app, {
    method: "POST",
    url: base,
    schemas: { body: payload, response: record },
    handler: async ({ body }) => required(await service.create(body))
  });
  registerContractRoute(app, {
    method: "PUT",
    url: `${base}/:id`,
    schemas: { body: payload, params, response: record },
    handler: async ({ body, params: value }) => required(await service.update(value.id, body))
  });
  for (const [action, active] of [
    ["activate", true],
    ["deactivate", false]
  ] as const) {
    registerContractRoute(app, {
      method: "POST",
      url: `${base}/:id/${action}`,
      schemas: { params, response: record },
      handler: async ({ params: value }) => required(await service.setActive(value.id, active))
    });
  }
}

function required<T>(value: T | null) {
  if (!value) throw AppError.notFound("Featured card was not found.");
  return value;
}
