import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { ProductVariantService } from "./product-variant.service.js";
const base = "/ecommerce/catalog/variants",
  service = new ProductVariantService(),
  params = z.object({ id: z.coerce.number().int().positive() }),
  status = z.enum(["active", "inactive"]);
const payload = z.object({
  productInformationId: z.number().int().positive(),
  sku: z.string().trim().min(1).max(120),
  title: z.string().trim().max(191),
  barcode: z.string().max(120).default(""),
  option1Name: z.string().max(80).default(""),
  option1Value: z.string().max(120).default(""),
  option2Name: z.string().max(80).default(""),
  option2Value: z.string().max(120).default(""),
  option3Name: z.string().max(80).default(""),
  option3Value: z.string().max(120).default(""),
  priceAdjustment: z.number().default(0),
  compareAtAdjustment: z.number().default(0),
  costAdjustment: z.number().default(0),
  weight: z.number().min(0).default(0),
  sortOrder: z.number().int().min(0).default(1000),
  status: status.default("active")
});
const record = payload.extend({
  id: z.number(),
  uuid: z.string().length(8),
  productTitle: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export async function registerProductVariantRoutes(app: FastifyInstance) {
  registerContractRoute(app, {
    method: "GET",
    url: base,
    schemas: {
      querystring: z.object({
        search: z.string().optional(),
        status: status.optional(),
        productInformationId: z.coerce.number().int().positive().optional()
      }),
      response: z.array(record)
    },
    handler: ({ query }) =>
      service.list({
        ...(query.search === undefined ? {} : { search: query.search }),
        ...(query.status === undefined ? {} : { status: query.status }),
        ...(query.productInformationId === undefined
          ? {}
          : { productInformationId: query.productInformationId })
      })
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${base}/products`,
    schemas: { response: z.array(z.object({ id: z.number(), title: z.string() })) },
    handler: () => service.productOptions()
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
  for (const [action, active] of [
    ["activate", true],
    ["deactivate", false]
  ] as const)
    registerContractRoute(app, {
      method: "POST",
      url: `${base}/:id/${action}`,
      schemas: { params, response: record },
      handler: async ({ params }) => required(await service.setActive(params.id, active))
    });
}
function required<T>(value: T | null) {
  if (!value) throw AppError.notFound("Variant was not found.");
  return value;
}
