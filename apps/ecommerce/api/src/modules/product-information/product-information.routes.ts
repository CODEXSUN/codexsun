import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { ProductInformationService } from "./product-information.service.js";

const base = "/ecommerce/catalog/product-information";
const service = new ProductInformationService();
const status = z.enum(["draft", "published", "archived"]);
const params = z.object({ id: z.coerce.number().int().positive() });
const payload = z.object({
  coreProductId: z.number().int().positive(),
  brandId: z.number().int().positive().nullable().default(null),
  storefrontTitle: z.string().trim().min(1),
  subtitle: z.string().max(255).default(""),
  slug: z.string().trim().min(1),
  shortDescription: z.string().max(500).default(""),
  description: z.string().default(""),
  bulletPoints: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  material: z.string().max(191).default(""),
  countryOfOrigin: z.string().max(120).default(""),
  manufacturer: z.string().max(191).default(""),
  warranty: z.string().max(500).default(""),
  returnPolicy: z.string().max(500).default(""),
  shippingClass: z.string().max(120).default("standard"),
  weight: z.number().min(0).default(0),
  length: z.number().min(0).default(0),
  width: z.number().min(0).default(0),
  height: z.number().min(0).default(0),
  minimumOrderQuantity: z.number().int().positive().default(1),
  maximumOrderQuantity: z.number().int().positive().nullable().default(null),
  seoTitle: z.string().max(191).default(""),
  seoDescription: z.string().max(320).default(""),
  publicationStatus: status.default("draft"),
  isFeatured: z.boolean().default(false)
});
const record = payload.extend({
  id: z.number(),
  uuid: z.string().length(8),
  coreProductName: z.string(),
  brandName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export async function registerProductInformationRoutes(app: FastifyInstance) {
  registerContractRoute(app, {
    method: "GET",
    url: base,
    schemas: {
      querystring: z.object({ search: z.string().optional(), status: status.optional() }),
      response: z.array(record)
    },
    handler: ({ query }) =>
      service.list({
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: query.status } : {})
      })
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${base}/core-products`,
    schemas: { response: z.array(z.object({ id: z.number(), name: z.string() })) },
    handler: () => service.coreProductOptions()
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${base}/core-brands`,
    schemas: { response: z.array(z.object({ id: z.number(), name: z.string() })) },
    handler: () => service.coreBrandOptions()
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${base}/:id`,
    schemas: { params, response: record },
    handler: async ({ params }) => required(await service.find(params.id))
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
    handler: async ({ body, params }) => required(await service.update(params.id, body))
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${base}/:id/archive`,
    schemas: { params, response: record },
    handler: async ({ params }) => required(await service.archive(params.id))
  });
}
function required<T>(value: T | null): T {
  if (!value) throw AppError.notFound("Product information was not found.");
  return value;
}
