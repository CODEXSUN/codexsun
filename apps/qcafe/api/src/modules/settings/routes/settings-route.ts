import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  cloudSyncSettingsSchema, connectorsResponseSchema, createConnectorSchema, databaseSettingsSchema,
  settingsErrorSchema, updateCloudSyncSchema, updateConnectorSchema,
} from "../contracts/settings.contract.js";
import { SettingsConflictError, SettingsService } from "../services/settings.service.js";

const connectorParamsSchema = z.object({ connectorId: z.string().uuid() });

export async function registerSettingsRoutes(
  app: FastifyInstance,
  service: SettingsService,
  contextFor: (request: FastifyRequest) => CommandContext,
): Promise<void> {
  app.get("/api/v1/qcafe/settings/database", { schema: { response: { 200: databaseSettingsSchema }, tags: ["Settings"] } }, async () => service.database());
  app.post("/api/v1/qcafe/settings/database/verify", { schema: { response: { 200: databaseSettingsSchema }, tags: ["Settings"] } }, async (request) => service.verifyDatabase(contextFor(request)));
  app.get("/api/v1/qcafe/settings/cloud-sync", { schema: { response: { 200: cloudSyncSettingsSchema }, tags: ["Settings"] } }, async () => service.cloudSync());
  app.put("/api/v1/qcafe/settings/cloud-sync", { schema: { body: updateCloudSyncSchema, response: { 200: cloudSyncSettingsSchema, 409: settingsErrorSchema }, tags: ["Settings"] } }, async (request, reply) => run(reply, () => service.setCloudSync(updateCloudSyncSchema.parse(request.body).enabled, contextFor(request))));
  app.get("/api/v1/qcafe/settings/connectors", { schema: { response: { 200: connectorsResponseSchema }, tags: ["Settings"] } }, async () => ({ connectors: await service.listConnectors() }));
  app.post("/api/v1/qcafe/settings/connectors", { schema: { body: createConnectorSchema, response: { 201: connectorsResponseSchema, 409: settingsErrorSchema }, tags: ["Settings"] } }, async (request, reply) => run(reply, () => service.createConnector(createConnectorSchema.parse(request.body), contextFor(request)), 201));
  app.put("/api/v1/qcafe/settings/connectors/:connectorId", { schema: { body: updateConnectorSchema, params: connectorParamsSchema, response: { 200: connectorsResponseSchema, 409: settingsErrorSchema }, tags: ["Settings"] } }, async (request, reply) => {
    const params = connectorParamsSchema.parse(request.params);
    return run(reply, () => service.setConnectorEnabled(params.connectorId, updateConnectorSchema.parse(request.body).enabled, contextFor(request)));
  });
}

async function run(reply: { code(statusCode: number): { send(value: unknown): unknown } }, command: () => Promise<unknown>, status = 200) {
  try { return reply.code(status).send(await command()); }
  catch (error) { if (error instanceof SettingsConflictError) return reply.code(409).send({ error: error.message }); throw error; }
}
