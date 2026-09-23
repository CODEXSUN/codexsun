import { zetroApiVersion, zetroIdeaBriefResponseSchema, zetroUpsertIdeaBriefSchema } from "@codexsun/zetro-contracts";
import type { FastifyInstance } from "fastify";
import { BriefReferenceError, BriefService } from "./brief-service";

export async function registerBriefRoutes(app: FastifyInstance, service: BriefService): Promise<void> {
  app.get<{ Params: { conversationId: string } }>("/api/zetro/v1/conversations/:conversationId/brief", async (request) =>
    zetroIdeaBriefResponseSchema.parse({ data: { brief: service.getBrief(request.params.conversationId) ?? null }, version: zetroApiVersion }),
  );

  app.put<{ Body: unknown; Params: { conversationId: string } }>("/api/zetro/v1/conversations/:conversationId/brief", async (request, reply) => {
    const input = zetroUpsertIdeaBriefSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: input.error.issues[0]?.message ?? "The idea brief is invalid.", code: "zetro.brief-invalid" });
    try {
      const brief = service.saveBrief(request.params.conversationId, input.data);
      return zetroIdeaBriefResponseSchema.parse({ data: { brief }, version: zetroApiVersion });
    } catch (error) {
      if (error instanceof BriefReferenceError) return reply.code(400).send({ error: error.message, code: "zetro.brief-reference" });
      throw error;
    }
  });
}
