import { timingSafeEqual } from "node:crypto";
import { zetroApiVersion, zetroHandoffReceiptResponseSchema, zetroPreparedTaskHandoffSchema, zunoAcceptedZetroHandoffListResponseSchema } from "@codexsun/zetro-contracts";
import type { FastifyInstance } from "fastify";
import { HandoffConflictError, ZunoHandoffService } from "./handoff-service";

export function registerZetroHandoffRoutes(app: FastifyInstance, service: ZunoHandoffService, clientKey: string): void {
  app.get("/api/v1/zuno/handoffs/zetro", async () =>
    zunoAcceptedZetroHandoffListResponseSchema.parse({ data: { handoffs: service.list() }, version: zetroApiVersion }),
  );

  app.post<{ Body: unknown }>("/api/v1/zuno/handoffs/zetro", async (request, reply) => {
    if (!matchesClientKey(request.headers["x-zetro-client-key"], clientKey)) return reply.code(401).send({ error: "Zetro authentication failed.", code: "zuno.handoff-auth" });
    const input = zetroPreparedTaskHandoffSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: input.error.issues[0]?.message ?? "The Zetro handoff is invalid.", code: "zuno.handoff-invalid" });
    try {
      const receipt = service.accept(input.data);
      return zetroHandoffReceiptResponseSchema.parse({ data: { receipt }, version: zetroApiVersion });
    } catch (error) {
      if (error instanceof HandoffConflictError) return reply.code(409).send({ error: error.message, code: "zuno.handoff-conflict" });
      throw error;
    }
  });
}

function matchesClientKey(value: string | string[] | undefined, expected: string): boolean {
  if (typeof value !== "string") return false;
  const supplied = Buffer.from(value);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}
