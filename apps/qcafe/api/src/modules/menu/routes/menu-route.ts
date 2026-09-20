import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  assignItemAllergenSchema,
  assignItemModifierGroupSchema,
  createAllergenTagSchema,
  createItemAvailabilitySchema,
  createMenuCategorySchema,
  createMenuItemSchema,
  createMenuVariantSchema,
  createModifierGroupSchema,
  createModifierOptionSchema,
  createPriceBookSchema,
  createSpecialCampaignSchema,
  createSpecialPriceSchema,
  effectiveAvailabilityQuerySchema,
  effectiveAvailabilityResponseSchema,
  effectiveCampaignPriceResponseSchema,
  effectivePriceQuerySchema,
  effectivePriceResponseSchema,
  effectiveSaleabilityQuerySchema,
  effectiveSaleabilityResponseSchema,
  menuCatalogQuerySchema,
  menuCatalogResponseSchema,
  menuErrorSchema,
  setMenuPriceSchema,
  uploadMenuMediaQuerySchema,
} from "../contracts/menu.contract.js";
import { MenuAvailabilityService } from "../services/menu-availability.service.js";
import { MenuCampaignService } from "../services/menu-campaign.service.js";
import { MenuCustomizationService } from "../services/menu-customization.service.js";
import { MenuMediaService } from "../services/menu-media.service.js";
import { MenuSaleabilityService } from "../services/menu-saleability.service.js";
import { MenuConflictError, MenuService } from "../services/menu.service.js";

const businessQuerySchema = z.object({ businessId: z.string().uuid() });
type ContextFactory = (request: FastifyRequest) => CommandContext;

export async function registerMenuRoutes(
  app: FastifyInstance,
  service: MenuService,
  media: MenuMediaService,
  availability: MenuAvailabilityService,
  customization: MenuCustomizationService,
  campaigns: MenuCampaignService,
  saleability: MenuSaleabilityService,
  contextFor: ContextFactory,
): Promise<void> {
  app.addContentTypeParser(
    /^image\/(?:gif|jpeg|png|webp)$/u,
    { bodyLimit: 5 * 1024 * 1024, parseAs: "buffer" },
    (_request, body, done) => done(null, body),
  );
  app.get(
    "/api/v1/qcafe/menu",
    { schema: { querystring: menuCatalogQuerySchema, response: { 200: menuCatalogResponseSchema }, tags: ["Menu"] } },
    async (request) => service.read(menuCatalogQuerySchema.parse(request.query).businessId),
  );
  app.get(
    "/api/v1/qcafe/menu/effective-price",
    {
      schema: {
        querystring: effectivePriceQuerySchema,
        response: { 200: effectivePriceResponseSchema },
        tags: ["Menu"],
      },
    },
    async (request) => ({ price: await service.findEffectivePrice(effectivePriceQuerySchema.parse(request.query)) }),
  );
  app.get(
    "/api/v1/qcafe/menu/effective-availability",
    {
      schema: {
        querystring: effectiveAvailabilityQuerySchema,
        response: { 200: effectiveAvailabilityResponseSchema },
        tags: ["Menu"],
      },
    },
    async (request) => availability.effective(effectiveAvailabilityQuerySchema.parse(request.query)),
  );
  app.get(
    "/api/v1/qcafe/menu/effective-saleability",
    {
      schema: {
        querystring: effectiveSaleabilityQuerySchema,
        response: { 200: effectiveSaleabilityResponseSchema },
        tags: ["Menu"],
      },
    },
    async (request) => saleability.effective(effectiveSaleabilityQuerySchema.parse(request.query)),
  );
  app.get(
    "/api/v1/qcafe/menu/effective-campaign-price",
    {
      schema: {
        querystring: effectiveSaleabilityQuerySchema,
        response: { 200: effectiveCampaignPriceResponseSchema },
        tags: ["Menu"],
      },
    },
    async (request) => campaigns.effective(effectiveSaleabilityQuerySchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/menu/categories", commandSchema(createMenuCategorySchema), async (request, reply) =>
    run(reply, () => service.createCategory(createMenuCategorySchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/menu/items", commandSchema(createMenuItemSchema), async (request, reply) =>
    run(reply, () => service.createItem(createMenuItemSchema.parse(request.body), contextFor(request))),
  );
  app.post(
    "/api/v1/qcafe/menu/variants",
    {
      schema: {
        body: createMenuVariantSchema,
        querystring: businessQuerySchema,
        response: { 201: menuCatalogResponseSchema, 409: menuErrorSchema },
        tags: ["Menu"],
      },
    },
    async (request, reply) =>
      run(reply, () =>
        service.createVariant(
          createMenuVariantSchema.parse(request.body),
          businessQuerySchema.parse(request.query).businessId,
          contextFor(request),
        ),
      ),
  );
  app.post("/api/v1/qcafe/menu/price-books", commandSchema(createPriceBookSchema), async (request, reply) =>
    run(reply, () => service.createPriceBook(createPriceBookSchema.parse(request.body), contextFor(request))),
  );
  app.post(
    "/api/v1/qcafe/menu/prices",
    {
      schema: {
        body: setMenuPriceSchema,
        querystring: businessQuerySchema,
        response: { 201: menuCatalogResponseSchema, 409: menuErrorSchema },
        tags: ["Menu"],
      },
    },
    async (request, reply) =>
      run(reply, () =>
        service.setPrice(
          setMenuPriceSchema.parse(request.body),
          businessQuerySchema.parse(request.query).businessId,
          contextFor(request),
        ),
      ),
  );
  app.post("/api/v1/qcafe/menu/special-campaigns", commandSchema(createSpecialCampaignSchema), async (request, reply) =>
    run(reply, () => campaigns.createCampaign(createSpecialCampaignSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/menu/special-prices", commandSchema(createSpecialPriceSchema), async (request, reply) =>
    run(reply, () => campaigns.createSpecialPrice(createSpecialPriceSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/menu/availability", commandSchema(createItemAvailabilitySchema), async (request, reply) =>
    run(reply, () => availability.create(createItemAvailabilitySchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/menu/modifier-groups", commandSchema(createModifierGroupSchema), async (request, reply) =>
    run(reply, () =>
      customization.createModifierGroup(createModifierGroupSchema.parse(request.body), contextFor(request)),
    ),
  );
  app.post("/api/v1/qcafe/menu/modifier-options", commandSchema(createModifierOptionSchema), async (request, reply) =>
    run(reply, () =>
      customization.createModifierOption(createModifierOptionSchema.parse(request.body), contextFor(request)),
    ),
  );
  app.post(
    "/api/v1/qcafe/menu/item-modifier-groups",
    commandSchema(assignItemModifierGroupSchema),
    async (request, reply) =>
      run(reply, () =>
        customization.assignModifierGroup(assignItemModifierGroupSchema.parse(request.body), contextFor(request)),
      ),
  );
  app.post("/api/v1/qcafe/menu/allergen-tags", commandSchema(createAllergenTagSchema), async (request, reply) =>
    run(reply, () => customization.createAllergenTag(createAllergenTagSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/menu/item-allergens", commandSchema(assignItemAllergenSchema), async (request, reply) =>
    run(reply, () => customization.assignAllergen(assignItemAllergenSchema.parse(request.body), contextFor(request))),
  );
  app.post(
    "/api/v1/qcafe/menu/media",
    {
      schema: {
        querystring: uploadMenuMediaQuerySchema,
        response: { 201: menuCatalogResponseSchema, 409: menuErrorSchema },
        tags: ["Menu"],
      },
    },
    async (request, reply) =>
      run(reply, async () => {
        if (!Buffer.isBuffer(request.body)) throw new MenuConflictError("Choose a supported menu image.");
        const mediaType = request.headers["content-type"]?.split(";", 1)[0]?.toLowerCase() ?? "";
        return media.upload(
          uploadMenuMediaQuerySchema.parse(request.query),
          mediaType,
          request.body,
          contextFor(request),
        );
      }),
  );
  app.get(
    "/api/v1/qcafe/menu/media/:assetId/content",
    {
      schema: { params: z.object({ assetId: z.string().uuid() }), querystring: businessQuerySchema, tags: ["Menu"] },
    },
    async (request, reply) => {
      const { assetId } = z.object({ assetId: z.string().uuid() }).parse(request.params);
      const { businessId } = businessQuerySchema.parse(request.query);
      const content = await media.read(assetId, businessId);
      if (!content) return reply.code(404).send({ error: "Menu media was not found." });
      return reply.header("Cache-Control", "private, max-age=300").type(content.mediaType).send(content.bytes);
    },
  );
}

function commandSchema(body: z.ZodTypeAny) {
  return { schema: { body, response: { 201: menuCatalogResponseSchema, 409: menuErrorSchema }, tags: ["Menu"] } };
}
async function run(
  reply: { code(statusCode: number): { send(value: unknown): unknown } },
  command: () => Promise<unknown>,
) {
  try {
    return reply.code(201).send(await command());
  } catch (error) {
    if (error instanceof MenuConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
