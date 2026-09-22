import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  createRouteSchema,
  createStationSchema,
  kitchenScopeSchema,
  kitchenWorkspaceSchema,
  printTicketSchema,
  ticketActionSchema,
  ticketIdSchema,
} from "../contracts/kitchen.contract.js";
import { KitchenConflictError, KitchenService } from "../services/kitchen.service.js";
export async function registerKitchenRoutes(
  app: FastifyInstance,
  service: KitchenService,
  contextFor: (r: FastifyRequest) => CommandContext,
) {
  app.get(
    "/api/v1/qcafe/kitchen",
    { schema: { querystring: kitchenScopeSchema, response: { 200: kitchenWorkspaceSchema }, tags: ["Kitchen"] } },
    (r) => {
      const q = kitchenScopeSchema.parse(r.query);
      return service.read(q.businessId, q.locationId);
    },
  );
  app.post("/api/v1/qcafe/kitchen/stations", async (r, p) =>
    run(p, () => service.station(createStationSchema.parse(r.body), contextFor(r))),
  );
  app.post("/api/v1/qcafe/kitchen/routes", async (r, p) =>
    run(p, () => service.route(createRouteSchema.parse(r.body), contextFor(r))),
  );
  app.post("/api/v1/qcafe/kitchen/tickets/:ticketId/actions", async (r, p) =>
    run(p, async () => {
      const b = ticketActionSchema.parse(r.body);
      await service.action(ticketIdSchema.parse(r.params).ticketId, b.action, b.note, contextFor(r));
      return { ok: true };
    }),
  );
  app.post("/api/v1/qcafe/kitchen/tickets/:ticketId/print", async (r, p) =>
    run(p, async () => {
      const b = printTicketSchema.parse(r.body);
      await service.print(ticketIdSchema.parse(r.params).ticketId, b.routeRef, contextFor(r));
      return { ok: true };
    }),
  );
}
async function run(reply: { code(n: number): { send(v: unknown): unknown } }, fn: () => Promise<unknown>) {
  try {
    return reply.code(201).send(await fn());
  } catch (e) {
    if (e instanceof KitchenConflictError) return reply.code(409).send({ error: e.message });
    throw e;
  }
}
