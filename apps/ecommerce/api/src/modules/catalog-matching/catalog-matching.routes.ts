import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { CatalogMatchingService } from "./catalog-matching.service.js";
const base = "/ecommerce/catalog/matches",
  service = new CatalogMatchingService(),
  status = z.enum(["matched", "semantic_pending", "unmatched"]),
  strategy = z.enum(["sku", "barcode", "slug", "title-brand", "semantic", "none"]);
const record = z.object({
  id: z.number(),
  uuid: z.string(),
  sourceReference: z.string(),
  query: z.object({
    sourceReference: z.string(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    slug: z.string().optional(),
    title: z.string(),
    brand: z.string().optional()
  }),
  productInformationId: z.number().nullable(),
  variantId: z.number().nullable(),
  strategy,
  confidence: z.number(),
  status,
  correlationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export async function registerCatalogMatchingRoutes(app: FastifyInstance) {
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
    method: "POST",
    url: base,
    schemas: {
      body: z.object({
        sourceReference: z.string().trim().min(1).max(191),
        sku: z.string().max(120).optional(),
        barcode: z.string().max(120).optional(),
        slug: z.string().max(191).optional(),
        title: z.string().trim().min(1).max(255),
        brand: z.string().max(191).optional(),
        allowSemantic: z.boolean().default(false),
        correlationId: z.string().max(191).optional()
      }),
      response: record
    },
    handler: ({ body }) =>
      service.match({
        allowSemantic: body.allowSemantic,
        sourceReference: body.sourceReference,
        title: body.title,
        ...(body.barcode === undefined ? {} : { barcode: body.barcode }),
        ...(body.brand === undefined ? {} : { brand: body.brand }),
        ...(body.correlationId === undefined ? {} : { correlationId: body.correlationId }),
        ...(body.sku === undefined ? {} : { sku: body.sku }),
        ...(body.slug === undefined ? {} : { slug: body.slug })
      })
  });
}
