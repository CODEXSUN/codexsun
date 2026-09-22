import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  createAreaSchema,
  createTableSchema,
  openTableSessionSchema,
  sessionIdSchema,
  tableScopeSchema,
  tableWorkspaceSchema,
} from "../contracts/table-service.contract.js";
import { TableServiceConflictError, TableServiceService } from "../services/table-service.service.js";
export async function registerTableServiceRoutes(
  app: FastifyInstance,
  service: TableServiceService,
  contextFor: (r: FastifyRequest) => CommandContext,
) {
  app.get(
    "/api/v1/qcafe/table-service",
    { schema: { querystring: tableScopeSchema, response: { 200: tableWorkspaceSchema }, tags: ["Table service"] } },
    (r) => {
      const q = tableScopeSchema.parse(r.query);
      return service.read(q.businessId, q.locationId);
    },
  );
  app.post("/api/v1/qcafe/table-service/areas", async (r, p) =>
    run(p, () => service.area(createAreaSchema.parse(r.body), contextFor(r))),
  );
  app.post("/api/v1/qcafe/table-service/tables", async (r, p) =>
    run(p, () => service.table(createTableSchema.parse(r.body), contextFor(r))),
  );
  app.post("/api/v1/qcafe/table-service/sessions", async (r, p) =>
    run(p, () => service.open(openTableSessionSchema.parse(r.body), contextFor(r))),
  );
  app.post("/api/v1/qcafe/table-service/sessions/:sessionId/close", async (r, p) =>
    run(p, () => service.close(sessionIdSchema.parse(r.params).sessionId, contextFor(r))),
  );
}
async function run(reply: { code(n: number): { send(v: unknown): unknown } }, fn: () => Promise<unknown>) {
  try {
    return reply.code(201).send(await fn());
  } catch (e) {
    if (e instanceof TableServiceConflictError) return reply.code(409).send({ error: e.message });
    throw e;
  }
}
