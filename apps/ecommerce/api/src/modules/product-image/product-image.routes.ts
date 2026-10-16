import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { ProductImageService } from "./product-image.service.js";
import { ecommerceEnv } from "../../env.js";
import { ProductImageStorage } from "./product-image.storage.js";
const base = "/ecommerce/catalog/images",
  service = new ProductImageService(),
  params = z.object({ id: z.coerce.number().int().positive() }),
  status = z.enum(["active", "inactive"]),
  payload = z.object({
    productInformationId: z.number().int().positive(),
    variantId: z.number().int().positive().nullable().default(null),
    url: z
      .string()
      .max(1000)
      .refine(
        (value) =>
          z.url().safeParse(value).success ||
          value.startsWith("/api/platform/storefront/product-images/"),
        "Enter a valid image URL."
      ),
    altText: z.string().trim().min(1).max(255),
    caption: z.string().max(500).default(""),
    sortOrder: z.number().int().min(0).default(1000),
    isPrimary: z.boolean().default(false),
    status: status.default("active")
  }),
  record = payload.extend({
    id: z.number(),
    uuid: z.string().length(8),
    productTitle: z.string(),
    variantTitle: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
  });
export async function registerProductImageRoutes(app: FastifyInstance) {
  const storage = new ProductImageStorage();
  app.post(
    `${base}/upload`,
    { bodyLimit: Math.ceil(ecommerceEnv.ECOMMERCE_PRODUCT_IMAGE_MAX_BYTES * 1.4) + 1024 },
    async (request) => {
      const body = z
        .object({ contentBase64: z.string().min(1), fileName: z.string().min(1).max(255) })
        .parse(request.body);
      return { data: await storage.upload(body.fileName, body.contentBase64), success: true };
    }
  );
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
    url: `${base}/variants`,
    schemas: {
      response: z.array(
        z.object({
          id: z.number(),
          productInformationId: z.number(),
          title: z.string(),
          sku: z.string()
        })
      )
    },
    handler: () => service.variantOptions()
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

export async function registerProductImagePublicRoutes(app: FastifyInstance) {
  const storage = new ProductImageStorage();
  app.get("/storefront/product-images/:fileName", async (request, reply) => {
    const { fileName } = z.object({ fileName: z.string().min(1).max(255) }).parse(request.params);
    const options = z
      .object({
        format: z.enum(["avif", "webp"]).default("webp"),
        width: z.coerce.number().int().min(160).max(1600).optional()
      })
      .parse(request.query);
    const image = await storage.content(fileName);
    if (!options.width) {
      return reply
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .type(image.mime)
        .send(image.body);
    }
    const body = await sharp(image.body)
      .rotate()
      .resize({ width: options.width, withoutEnlargement: true })
      .toFormat(options.format, { quality: 82 })
      .toBuffer();
    return reply
      .header("Cache-Control", "public, max-age=31536000, immutable")
      .type(`image/${options.format}`)
      .send(body);
  });
}
function required<T>(v: T | null) {
  if (!v) throw AppError.notFound("Product image was not found.");
  return v;
}
