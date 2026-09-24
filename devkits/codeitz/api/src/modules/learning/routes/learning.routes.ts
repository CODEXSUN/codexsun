import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  engineeringExperienceSchema,
  queryHeuristicsInputSchema,
  recordExperienceInputSchema,
  synthesizedHeuristicSchema,
} from "../contracts/learning-contracts.js";
import { SelfLearningService } from "../service/self-learning.service.js";

export function registerLearningRoutes(
  app: FastifyInstance,
  service: SelfLearningService,
  prefix: string = "/api/v1/codeitz/learning",
): void {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    `${prefix}/experiences`,
    {
      schema: {
        body: recordExperienceInputSchema,
        response: {
          201: z.object({
            experience: engineeringExperienceSchema,
            synthesized: z.array(synthesizedHeuristicSchema),
          }),
        },
        tags: ["Self-Learning System"],
      },
    },
    async (request, reply) => {
      const result = service.recordExperience(request.body);
      return reply.code(201).send(result);
    },
  );

  server.get(
    `${prefix}/experiences`,
    {
      schema: {
        response: {
          200: z.array(engineeringExperienceSchema),
        },
        tags: ["Self-Learning System"],
      },
    },
    async (_request, reply) => {
      return reply.send(service.listExperiences());
    },
  );

  server.get(
    `${prefix}/heuristics`,
    {
      schema: {
        response: {
          200: z.array(synthesizedHeuristicSchema),
        },
        tags: ["Self-Learning System"],
      },
    },
    async (_request, reply) => {
      return reply.send(service.listHeuristics());
    },
  );

  server.post(
    `${prefix}/match`,
    {
      schema: {
        body: queryHeuristicsInputSchema,
        response: {
          200: z.array(synthesizedHeuristicSchema),
        },
        tags: ["Self-Learning System"],
      },
    },
    async (request, reply) => {
      const matched = service.queryRelevantHeuristics(request.body);
      return reply.send(matched);
    },
  );

  server.post(
    `${prefix}/heuristics/:id/reinforce`,
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ wasEffective: z.boolean() }),
        response: {
          200: synthesizedHeuristicSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["Self-Learning System"],
      },
    },
    async (request, reply) => {
      try {
        const updated = service.reinforceHeuristic(request.params.id, request.body.wasEffective);
        return reply.send(updated);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );
}
