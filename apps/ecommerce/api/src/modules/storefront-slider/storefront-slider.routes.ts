import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { ok, registerContractRoute } from "@codexsun/framework/http";
import { ecommerceEnv } from "../../env.js";
import { StorefrontSliderService } from "./storefront-slider.service.js";
import { StorefrontSliderStorage } from "./storefront-slider.storage.js";

const base = "/ecommerce/storefront/sliders";
const params = z.object({ id: z.coerce.number().int().positive() });
const status = z.enum(["active", "inactive"]);
const payload = z.object({
  actionLabel: z.string().trim().max(120).default(""),
  actionUrl: z.string().trim().max(1000).default(""),
  description: z.string().trim().max(500).default(""),
  displayOrder: z.number().int().min(0).default(0),
  endsAt: z.iso.datetime().nullable().default(null),
  eyebrow: z.string().trim().max(191).default(""),
  imageUrl: z.string().trim().max(1000).default(""),
  ishopItem: z.string().trim().max(191).nullable().default(null),
  published: z.boolean().default(false),
  sliderCode: z.string().trim().min(1).max(191),
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
const storageSettings = z.object({
  acceptedMimeTypes: z.tuple([z.literal("image/webp")]),
  maxUploadBytes: z.number().int().positive(),
  publicPath: z.literal("/")
});
const imageUpload = z.object({
  contentBase64: z.string().min(1),
  fileName: z.string().min(1).max(255)
});

export async function registerStorefrontSliderRoutes(app: FastifyInstance) {
  const service = new StorefrontSliderService();
  const storage = new StorefrontSliderStorage();
  registerContractRoute(app, {
    method: "GET",
    url: `${base}/storage`,
    schemas: { response: storageSettings },
    handler: () => storage.settings()
  });
  app.route({
    method: "POST",
    url: `${base}/images`,
    bodyLimit: Math.ceil(ecommerceEnv.ECOMMERCE_SLIDER_IMAGE_MAX_BYTES * 1.4) + 1024,
    handler: async (request) => {
      const body = parseImageUpload(request.body);
      return ok(await storage.upload(body.fileName, body.contentBase64), {
        requestId: request.id,
        ...(request.tenantId ? { tenantId: request.tenantId } : {})
      });
    }
  });
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
  if (!value) throw AppError.notFound("Home slider was not found.");
  return value;
}

function parseImageUpload(value: unknown) {
  const result = imageUpload.safeParse(value);
  if (!result.success) throw AppError.validation("Invalid slider image upload.");
  return result.data;
}
