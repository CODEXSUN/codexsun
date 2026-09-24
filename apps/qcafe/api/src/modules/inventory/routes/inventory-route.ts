import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  createRecipeSchema,
  createStockItemSchema,
  createStockUnitSchema,
  inventoryScopeSchema,
  inventoryWorkspaceSchema,
  postStockAdjustmentSchema,
  recipeIdSchema,
  reviseRecipeSchema,
} from "../contracts/inventory.contract.js";
import { InventoryConflictError, InventoryService } from "../services/inventory.service.js";

type Context = (request: FastifyRequest) => CommandContext;

export async function registerInventoryRoutes(app: FastifyInstance, service: InventoryService, contextFor: Context) {
  app.get(
    "/api/v1/qcafe/inventory",
    { schema: { querystring: inventoryScopeSchema, response: { 200: inventoryWorkspaceSchema }, tags: ["Inventory"] } },
    (request) => service.read(inventoryScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/inventory/units", async (request, reply) =>
    run(reply, () => service.createUnit(createStockUnitSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/items", async (request, reply) =>
    run(reply, () => service.createItem(createStockItemSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/adjustments", async (request, reply) =>
    run(reply, () => service.adjust(postStockAdjustmentSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/recipes", async (request, reply) =>
    run(reply, () => service.createRecipe(createRecipeSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/recipes/:recipeId/revisions", async (request, reply) =>
    run(reply, () =>
      service.reviseRecipe(
        recipeIdSchema.parse(request.params).recipeId,
        reviseRecipeSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
}

async function run(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  work: () => Promise<unknown>,
) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof InventoryConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
