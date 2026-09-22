import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  addOrderLineSchema,
  changeOrderLineSchema,
  createOrderSchema,
  orderActionSchema,
  orderAdjustmentSchema,
  orderIdSchema,
  orderLineIdSchema,
  orderNoteSchema,
  posScopeSchema,
  posWorkspaceSchema,
} from "../contracts/pos.contract.js";
import { PosConflictError, PosService } from "../services/pos.service.js";
type Context = (request: FastifyRequest) => CommandContext;
type Confirmed = (orderId: string, context: CommandContext) => Promise<void>;
type Ready = (orderId: string) => Promise<void>;
export async function registerPosRoutes(
  app: FastifyInstance,
  service: PosService,
  onConfirmed: Confirmed,
  assertReady: Ready,
  assertSettled: Ready,
  contextFor: Context,
) {
  app.get(
    "/api/v1/qcafe/pos",
    { schema: { querystring: posScopeSchema, response: { 200: posWorkspaceSchema }, tags: ["POS"] } },
    (r) => service.read(posScopeSchema.parse(r.query)),
  );
  app.post("/api/v1/qcafe/pos/orders", async (r, p) =>
    run(p, () => service.create(createOrderSchema.parse(r.body), contextFor(r))),
  );
  app.post("/api/v1/qcafe/pos/orders/:orderId/lines", async (r, p) =>
    run(p, () =>
      service.addLine(orderIdSchema.parse(r.params).orderId, addOrderLineSchema.parse(r.body), contextFor(r)),
    ),
  );
  app.put("/api/v1/qcafe/pos/orders/:orderId/lines/:lineId", async (r, p) =>
    run(p, () => {
      const ids = orderLineIdSchema.parse(r.params);
      return service.changeLine(ids.orderId, ids.lineId, changeOrderLineSchema.parse(r.body), contextFor(r));
    }),
  );
  app.delete("/api/v1/qcafe/pos/orders/:orderId/lines/:lineId", async (r, p) =>
    run(p, () => {
      const ids = orderLineIdSchema.parse(r.params);
      return service.removeLine(ids.orderId, ids.lineId, contextFor(r));
    }),
  );
  for (const action of ["hold", "resume", "cancel"] as const)
    app.post(`/api/v1/qcafe/pos/orders/:orderId/${action}`, async (r, p) =>
      run(p, () =>
        service.action(
          orderIdSchema.parse(r.params).orderId,
          action,
          orderActionSchema.parse(r.body).reason,
          contextFor(r),
        ),
      ),
    );
  app.post("/api/v1/qcafe/pos/orders/:orderId/fulfill", async (r, p) =>
    run(p, async () => {
      const id = orderIdSchema.parse(r.params).orderId;
      await assertReady(id);
      await assertSettled(id);
      return service.action(id, "fulfill", orderActionSchema.parse(r.body).reason, contextFor(r));
    }),
  );
  app.post("/api/v1/qcafe/pos/orders/:orderId/confirm", async (r, p) =>
    run(p, async () => {
      const id = orderIdSchema.parse(r.params).orderId,
        context = contextFor(r),
        result = await service.action(id, "confirm", orderActionSchema.parse(r.body).reason, context);
      await onConfirmed(id, context);
      return result;
    }),
  );
  app.post("/api/v1/qcafe/pos/orders/:orderId/adjustments", async (r, p) =>
    run(p, () =>
      service.adjust(orderIdSchema.parse(r.params).orderId, orderAdjustmentSchema.parse(r.body), contextFor(r)),
    ),
  );
  app.post("/api/v1/qcafe/pos/orders/:orderId/notes", async (r, p) =>
    run(p, () => service.note(orderIdSchema.parse(r.params).orderId, orderNoteSchema.parse(r.body), contextFor(r))),
  );
}
async function run(reply: { code(n: number): { send(v: unknown): unknown } }, fn: () => Promise<unknown>) {
  try {
    return reply.code(201).send(await fn());
  } catch (error) {
    if (error instanceof PosConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
