import type { ProviderEngine } from "@codexsun/framework";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { orchestrationAttemptSchema, verificationCheckSchema } from "../contracts/orchestration.contract.js";
import { OrchestrationService } from "../service/orchestration.service.js";

const attemptParamsSchema = z.object({ attemptId: z.string().trim().min(1).max(120) });
const createAttemptSchema = orchestrationAttemptSchema.omit({ state: true });

export async function registerOrchestrationRoutes(app: FastifyInstance, engine: ProviderEngine): Promise<void> {
  app.get("/api/v1/orship/health", async () => ({
    service: "orship",
    status: engine.isReady() ? "ok" : "degraded",
    providers: engine.readiness(),
  }));

  app.get("/api/v1/orship/modules", async () => ({ providers: engine.ids() }));

  const service = engine.require<OrchestrationService>("orship.orchestration.service");
  app.get("/api/v1/orship/attempts", async () => ({ attempts: await service.list() }));

  app.post("/api/v1/orship/attempts", async (request, reply) => {
    const parsed = createAttemptSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "The orchestration attempt is invalid." });
    try {
      return reply.code(201).send({ attempt: await service.create(parsed.data) });
    } catch (error) {
      return reply
        .code(409)
        .send({ error: error instanceof Error ? error.message : "The attempt could not be created." });
    }
  });

  app.post("/api/v1/orship/attempts/:attemptId/checks", async (request, reply) => {
    const params = attemptParamsSchema.safeParse(request.params);
    const check = verificationCheckSchema.safeParse(request.body);
    if (!params.success || !check.success) return reply.code(400).send({ error: "The verification check is invalid." });
    try {
      return { attempt: await service.recordCheck(params.data.attemptId, check.data) };
    } catch (error) {
      return reply.code(404).send({ error: error instanceof Error ? error.message : "The attempt was not found." });
    }
  });

  app.post("/api/v1/orship/attempts/:attemptId/approval-request", async (request, reply) => {
    const params = attemptParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "The attempt ID is invalid." });
    try {
      return { attempt: await service.requestApproval(params.data.attemptId) };
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : "Approval cannot be requested." });
    }
  });
}
