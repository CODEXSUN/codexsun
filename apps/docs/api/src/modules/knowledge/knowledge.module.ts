import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerKnowledgeRoutes } from "./knowledge.routes.js";
import type { KnowledgeContext } from "./knowledge.types.js";
// Reviewed file sources are protected. This hybrid reader permits audited tenant body overrides and restoration only; source create/delete/status belongs to Git/code review, not runtime CRUD.
export const docsKnowledgeModule = {
  // Synchronous tenant operations: no event bus, background jobs, or offline sync.
  capabilities: { events: false, worker: false, sync: false },
  key: "docs.knowledge",
  register: (
    app: FastifyInstance,
    context: (request: FastifyRequest) => Promise<KnowledgeContext>
  ) => registerKnowledgeRoutes(app, context)
};
