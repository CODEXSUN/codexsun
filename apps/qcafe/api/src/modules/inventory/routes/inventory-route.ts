import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  addDailyPlanLineSchema,
  consumeRecipeSchema,
  createDailyPlanSchema,
  createPurchaseOrderSchema,
  createRecipeSchema,
  createStockItemSchema,
  createStockLotSchema,
  createStockUnitSchema,
  dailyPlanIdSchema,
  inventoryScopeSchema,
  inventoryWorkspaceSchema,
  postStockAdjustmentSchema,
  purchaseOrderIdSchema,
  receiveGoodsSchema,
  recipeIdSchema,
  recordWasteSchema,
  reservationIdSchema,
  reserveStockSchema,
  reviseRecipeSchema,
  submitStockCountSchema,
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
  app.post("/api/v1/qcafe/inventory/daily-plans", async (request, reply) =>
    run(reply, () => service.createDailyPlan(createDailyPlanSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/daily-plans/:planId/lines", async (request, reply) =>
    run(reply, () =>
      service.addDailyPlanLine(
        dailyPlanIdSchema.parse(request.params).planId,
        addDailyPlanLineSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/inventory/daily-plans/:planId/confirm", async (request, reply) =>
    run(reply, () => service.confirmDailyPlan(dailyPlanIdSchema.parse(request.params).planId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/reservations", async (request, reply) =>
    run(reply, () => service.reserve(reserveStockSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/reservations/:reservationId/release", async (request, reply) =>
    run(reply, () =>
      service.releaseReservation(reservationIdSchema.parse(request.params).reservationId, contextFor(request)),
    ),
  );
  app.post("/api/v1/qcafe/inventory/reservations/:reservationId/consume", async (request, reply) =>
    run(reply, () =>
      service.consumeReservation(reservationIdSchema.parse(request.params).reservationId, contextFor(request)),
    ),
  );
  app.post("/api/v1/qcafe/inventory/purchase-orders", async (request, reply) =>
    run(reply, () => service.createPurchaseOrder(createPurchaseOrderSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/purchase-orders/:poId/send", async (request, reply) =>
    run(reply, () => service.sendPurchaseOrder(purchaseOrderIdSchema.parse(request.params).poId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/purchase-orders/:poId/cancel", async (request, reply) =>
    run(reply, () =>
      service.cancelPurchaseOrder(purchaseOrderIdSchema.parse(request.params).poId, contextFor(request)),
    ),
  );
  app.post("/api/v1/qcafe/inventory/purchase-orders/:poId/receipts", async (request, reply) =>
    run(reply, () =>
      service.receiveGoods(
        purchaseOrderIdSchema.parse(request.params).poId,
        receiveGoodsSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/inventory/lots", async (request, reply) =>
    run(reply, () => service.createLot(createStockLotSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/counts", async (request, reply) =>
    run(reply, () => service.submitCount(submitStockCountSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/waste", async (request, reply) =>
    run(reply, () => service.recordWaste(recordWasteSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/inventory/consumptions", async (request, reply) =>
    run(reply, () => service.consumeForSale(consumeRecipeSchema.parse(request.body), contextFor(request))),
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
