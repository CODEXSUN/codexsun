import { garmentsFrappeLogsResponseSchema } from "@codexsun/garments-contracts";
import type { FastifyInstance } from "fastify";
import { FrappeLogClient, FrappeLogConfigurationError, FrappeLogRequestError } from "./frappe-log-client.js";

export async function registerGarmentsFrappeRoutes(server: FastifyInstance, client: FrappeLogClient): Promise<void> {
  server.get("/api/garments/v1/frappe/logs", async (_request, reply) => {
    try {
      return garmentsFrappeLogsResponseSchema.parse({ data: await client.listApparelLogs(), version: "v1" });
    } catch (error) {
      const statusCode = error instanceof FrappeLogConfigurationError ? 503 : error instanceof FrappeLogRequestError ? 502 : 500;
      return reply.code(statusCode).send({ error: "Could not retrieve apparel logs from Frappe." });
    }
  });
}
