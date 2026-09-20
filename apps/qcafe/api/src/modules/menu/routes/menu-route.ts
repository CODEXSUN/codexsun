import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  createMenuCategorySchema, createMenuItemSchema, createMenuVariantSchema, createPriceBookSchema,
  effectivePriceQuerySchema, effectivePriceResponseSchema, menuCatalogQuerySchema, menuCatalogResponseSchema,
  menuErrorSchema, setMenuPriceSchema,
} from "../contracts/menu.contract.js";
import { MenuConflictError, MenuService } from "../services/menu.service.js";

const businessQuerySchema = z.object({ businessId: z.string().uuid() });
type ContextFactory = (request: FastifyRequest) => CommandContext;

export async function registerMenuRoutes(app: FastifyInstance, service: MenuService, contextFor: ContextFactory): Promise<void> {
  app.get("/api/v1/qcafe/menu", { schema: { querystring: menuCatalogQuerySchema, response: { 200: menuCatalogResponseSchema }, tags: ["Menu"] } },
    async (request) => service.read(menuCatalogQuerySchema.parse(request.query).businessId));
  app.get("/api/v1/qcafe/menu/effective-price", { schema: { querystring: effectivePriceQuerySchema, response: { 200: effectivePriceResponseSchema }, tags: ["Menu"] } },
    async (request) => ({ price: await service.findEffectivePrice(effectivePriceQuerySchema.parse(request.query)) }));
  app.post("/api/v1/qcafe/menu/categories", commandSchema(createMenuCategorySchema), async (request, reply) =>
    run(reply, () => service.createCategory(createMenuCategorySchema.parse(request.body), contextFor(request))));
  app.post("/api/v1/qcafe/menu/items", commandSchema(createMenuItemSchema), async (request, reply) =>
    run(reply, () => service.createItem(createMenuItemSchema.parse(request.body), contextFor(request))));
  app.post("/api/v1/qcafe/menu/variants", { schema: { body: createMenuVariantSchema, querystring: businessQuerySchema, response: { 201: menuCatalogResponseSchema, 409: menuErrorSchema }, tags: ["Menu"] } }, async (request, reply) =>
    run(reply, () => service.createVariant(createMenuVariantSchema.parse(request.body), businessQuerySchema.parse(request.query).businessId, contextFor(request))));
  app.post("/api/v1/qcafe/menu/price-books", commandSchema(createPriceBookSchema), async (request, reply) =>
    run(reply, () => service.createPriceBook(createPriceBookSchema.parse(request.body), contextFor(request))));
  app.post("/api/v1/qcafe/menu/prices", { schema: { body: setMenuPriceSchema, querystring: businessQuerySchema, response: { 201: menuCatalogResponseSchema, 409: menuErrorSchema }, tags: ["Menu"] } }, async (request, reply) =>
    run(reply, () => service.setPrice(setMenuPriceSchema.parse(request.body), businessQuerySchema.parse(request.query).businessId, contextFor(request))));
}

function commandSchema(body: z.ZodTypeAny) {
  return { schema: { body, response: { 201: menuCatalogResponseSchema, 409: menuErrorSchema }, tags: ["Menu"] } };
}
async function run(reply: { code(statusCode: number): { send(value: unknown): unknown } }, command: () => Promise<unknown>) {
  try { return reply.code(201).send(await command()); }
  catch (error) { if (error instanceof MenuConflictError) return reply.code(409).send({ error: error.message }); throw error; }
}
