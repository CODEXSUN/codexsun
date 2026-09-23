import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { agentRegistrationSchema, assignmentParamsSchema, createAssignmentSchema } from "./agent-contracts.js";
import { AgentService, AgentServiceError } from "./agent-service.js";

export function registerAgentRoutes(app: FastifyInstance, service: AgentService, actor: (request: FastifyRequest) => string | undefined, bootstrapKey: string): void {
  app.post("/api/v1/zuno/agents/register", async (request, reply) => {
    if (request.headers["x-zxa-bootstrap-key"] !== bootstrapKey) return reply.code(401).send({ error: "ZXA authentication failed." });
    return reply.code(201).send(service.register(agentRegistrationSchema.parse(request.body)));
  });

  app.register(async (routes) => {
    routes.addHook("onRequest", async (request, reply) => { if (!actor(request)) return reply.code(401).send({ error: "Authentication required." }); });
    routes.setErrorHandler((error, _request, reply) => reply.code(error instanceof AgentServiceError ? error.status : error instanceof z.ZodError ? 400 : 502).send({ error: error instanceof Error ? error.message : "Agent operation failed." }));
    routes.get("/api/v1/zuno/agents", async () => ({ agents: service.agents() }));
    routes.get("/api/v1/zuno/agents/:id/connection", async (request) => service.connection(assignmentParamsSchema.parse(request.params).id));
    routes.post("/api/v1/zuno/agents/:id/connection/device-code", async (request) => service.startDeviceCode(assignmentParamsSchema.parse(request.params).id));
    routes.get("/api/v1/zuno/agents/assignments", async () => ({ assignments: service.assignments() }));
    routes.post("/api/v1/zuno/agents/assignments", async (request, reply) => reply.code(201).send(service.createAssignment(createAssignmentSchema.parse(request.body), actor(request)!)));
    routes.post("/api/v1/zuno/agents/assignments/:id/approve", async (request) => service.approve(assignmentParamsSchema.parse(request.params).id));
  });
}
