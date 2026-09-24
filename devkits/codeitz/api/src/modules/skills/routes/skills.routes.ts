import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  skillDefinitionSchema,
  skillDistillationRequestSchema,
} from "../contracts/skills-contracts.js";
import { SkillDistillerService } from "../service/skill-distiller.service.js";

export function registerSkillsRoutes(
  app: FastifyInstance,
  service: SkillDistillerService,
  prefix: string = "/api/v1/codeitz/skills",
): void {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    `${prefix}`,
    {
      schema: {
        response: {
          200: z.array(skillDefinitionSchema),
        },
        tags: ["Skills System"],
      },
    },
    async (_request, reply) => {
      return reply.send(service.listSkills());
    },
  );

  server.get(
    `${prefix}/:name`,
    {
      schema: {
        params: z.object({ name: z.string() }),
        response: {
          200: skillDefinitionSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["Skills System"],
      },
    },
    async (request, reply) => {
      const skill =
        service.getSkillByName(request.params.name) ?? service.getSkill(request.params.name);
      if (!skill) {
        return reply.code(404).send({ error: `Skill ${request.params.name} not found.` });
      }
      return reply.send(skill);
    },
  );

  server.post(
    `${prefix}/distill`,
    {
      schema: {
        body: skillDistillationRequestSchema,
        response: {
          201: skillDefinitionSchema,
        },
        tags: ["Skills System"],
      },
    },
    async (request, reply) => {
      const skill = service.distillSkill(request.body);
      return reply.code(201).send(skill);
    },
  );
}
