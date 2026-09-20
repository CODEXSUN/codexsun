import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createBusinessSetupSchema,
  createLocationSchema,
  foundationSetupErrorSchema,
  foundationSetupResponseSchema,
  openBusinessDaySchema,
} from "../contracts/foundation-setup.contract.js";
import { FoundationSetupConflictError, FoundationSetupService } from "../services/foundation-setup.service.js";
import type { CommandContext } from "../contracts/activity.contract.js";

const locationParamsSchema = z.object({ locationId: z.string().uuid() });

export async function registerFoundationSetupRoutes(
  app: FastifyInstance,
  service: FoundationSetupService,
  contextFor: (request: FastifyRequest) => CommandContext,
): Promise<void> {
  app.get(
    "/api/v1/qcafe/foundation/setup",
    { schema: { response: { 200: foundationSetupResponseSchema }, tags: ["Foundation"] } },
    async () => service.read(),
  );
  app.post(
    "/api/v1/qcafe/foundation/businesses",
    {
      schema: {
        body: createBusinessSetupSchema,
        response: { 201: foundationSetupResponseSchema },
        tags: ["Foundation"],
      },
    },
    async (request, reply) =>
      reply.code(201).send(await service.createBusiness(createBusinessSetupSchema.parse(request.body), contextFor(request))),
  );
  app.post(
    "/api/v1/qcafe/foundation/locations",
    {
      schema: {
        body: createLocationSchema,
        response: { 201: foundationSetupResponseSchema, 409: foundationSetupErrorSchema },
        tags: ["Foundation"],
      },
    },
    async (request, reply) => runCommand(reply, () => service.createLocation(createLocationSchema.parse(request.body), contextFor(request))),
  );
  app.post(
    "/api/v1/qcafe/foundation/locations/:locationId/business-days",
    {
      schema: {
        body: openBusinessDaySchema,
        params: locationParamsSchema,
        response: { 201: foundationSetupResponseSchema, 409: foundationSetupErrorSchema },
        tags: ["Foundation"],
      },
    },
    async (request, reply) => {
      const params = locationParamsSchema.parse(request.params);
      const body = openBusinessDaySchema.parse(request.body);
      return runCommand(reply, () => service.openBusinessDay(params.locationId, body.businessDate, contextFor(request)));
    },
  );
}

async function runCommand(
  reply: { code(statusCode: number): { send(value: unknown): unknown } },
  command: () => Promise<FoundationSetupResponse>,
): Promise<unknown> {
  try {
    return reply.code(201).send(await command());
  } catch (error) {
    if (error instanceof FoundationSetupConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}

type FoundationSetupResponse = Awaited<ReturnType<FoundationSetupService["read"]>>;
