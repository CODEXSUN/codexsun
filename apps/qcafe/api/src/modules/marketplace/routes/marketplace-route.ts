import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  intakeIdSchema,
  intakeOrderSchema,
  linkOrderSchema,
  mapMenuItemSchema,
  marketplaceScopeSchema,
  marketplaceWorkspaceSchema,
  partnerIdSchema,
  recordFulfillmentSchema,
  recordSettlementSchema,
  registerPartnerSchema,
  rejectIntakeSchema,
  settlementIdSchema,
} from "../contracts/marketplace.contract.js";
import { MarketplaceConflictError, MarketplaceService } from "../services/marketplace.service.js";

type Context = (request: FastifyRequest) => CommandContext;

export async function registerMarketplaceRoutes(
  app: FastifyInstance,
  service: MarketplaceService,
  contextFor: Context,
) {
  app.get(
    "/api/v1/qcafe/marketplace",
    {
      schema: {
        querystring: marketplaceScopeSchema,
        response: { 200: marketplaceWorkspaceSchema },
        tags: ["Marketplace"],
      },
    },
    (request) => service.read(marketplaceScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/marketplace/partners", async (request, reply) =>
    run(reply, () => service.registerPartner(registerPartnerSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/partners/:partnerId/suspend", async (request, reply) =>
    run(reply, () => service.suspendPartner(partnerIdSchema.parse(request.params).partnerId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/partners/:partnerId/reactivate", async (request, reply) =>
    run(reply, () => service.reactivatePartner(partnerIdSchema.parse(request.params).partnerId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/menu-mappings", async (request, reply) =>
    run(reply, () => service.mapMenuItem(mapMenuItemSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/intakes", async (request, reply) =>
    run(reply, () => service.intakeOrder(intakeOrderSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/intakes/:intakeId/accept", async (request, reply) =>
    run(reply, () => service.acceptIntake(intakeIdSchema.parse(request.params).intakeId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/intakes/:intakeId/reject", async (request, reply) =>
    run(reply, () =>
      service.rejectIntake(
        intakeIdSchema.parse(request.params).intakeId,
        rejectIntakeSchema.parse(request.body).reason,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/marketplace/settlements", async (request, reply) =>
    run(reply, () => service.recordSettlement(recordSettlementSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/settlements/:settlementId/post", async (request, reply) =>
    run(reply, () =>
      service.postSettlement(settlementIdSchema.parse(request.params).settlementId, contextFor(request)),
    ),
  );
  app.post("/api/v1/qcafe/marketplace/intakes/:intakeId/link-order", async (request, reply) =>
    run(reply, () =>
      service.linkOrder(
        intakeIdSchema.parse(request.params).intakeId,
        linkOrderSchema.parse(request.body).orderId,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/marketplace/intakes/:intakeId/fulfillment", async (request, reply) =>
    run(reply, () =>
      service.recordFulfillment(
        intakeIdSchema.parse(request.params).intakeId,
        recordFulfillmentSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/marketplace/intakes/:intakeId/pick", async (request, reply) =>
    run(reply, () => service.markPicked(intakeIdSchema.parse(request.params).intakeId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/intakes/:intakeId/deliver", async (request, reply) =>
    run(reply, () => service.markDelivered(intakeIdSchema.parse(request.params).intakeId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/marketplace/intakes/:intakeId/cancel-fulfillment", async (request, reply) =>
    run(reply, () => service.cancelFulfillment(intakeIdSchema.parse(request.params).intakeId, contextFor(request))),
  );
  app.get("/api/v1/qcafe/marketplace/intakes/:intakeId/reconciliation", async (request, reply) =>
    run(reply, () => service.reconcileIntake(intakeIdSchema.parse(request.params).intakeId)),
  );
}

async function run(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  work: () => Promise<unknown>,
) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof MarketplaceConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
