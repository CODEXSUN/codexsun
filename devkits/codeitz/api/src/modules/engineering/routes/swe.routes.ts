import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  advancePhaseInputSchema,
  createSweTaskInputSchema,
  runVerificationInputSchema,
  sweTaskSchema,
} from "../contracts/swe-contracts.js";
import { SweOrchestratorService } from "../service/swe-orchestrator.service.js";

export function registerSweRoutes(
  app: FastifyInstance,
  service: SweOrchestratorService,
  prefix: string = "/api/v1/codeitz/swe",
): void {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    `${prefix}/tasks`,
    {
      schema: {
        body: createSweTaskInputSchema,
        response: {
          201: sweTaskSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const task = service.createTask(request.body);
      return reply.code(201).send(task);
    },
  );

  server.get(
    `${prefix}/tasks`,
    {
      schema: {
        response: {
          200: z.array(sweTaskSchema),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      return reply.send(service.listTasks());
    },
  );

  server.get(
    `${prefix}/tasks/:id`,
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: sweTaskSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const task = service.getTask(request.params.id);
        return reply.send(task);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );

  server.post(
    `${prefix}/tasks/:id/advance`,
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: advancePhaseInputSchema,
        response: {
          200: sweTaskSchema,
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const task = service.advancePhase(request.params.id, request.body);
        return reply.send(task);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  server.post(
    `${prefix}/tasks/:id/verify`,
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: runVerificationInputSchema,
        response: {
          200: z.object({
            task: sweTaskSchema,
            passed: z.boolean(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const result = service.runVerificationGate(request.params.id, request.body);
        return reply.send(result);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );
}
