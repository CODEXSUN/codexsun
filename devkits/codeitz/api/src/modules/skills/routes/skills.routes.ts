import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  organizeSkillInputSchema,
  parsedSkillSchema,
  recommendSkillsInputSchema,
  scanSkillsInputSchema,
  skillCatalogSchema,
  skillDefinitionSchema,
  skillDistillationRequestSchema,
  skillRecommendationSchema,
} from "../contracts/skills-contracts.js";
import { SkillDistillerService } from "../service/skill-distiller.service.js";
import { SkillOrganiserService } from "../service/skill-organiser.service.js";

export function registerSkillsRoutes(
  app: FastifyInstance,
  service: SkillDistillerService,
  organiser?: SkillOrganiserService,
  prefix: string = "/api/v1/codeitz/skills",
): void {
  const organiserService = organiser ?? new SkillOrganiserService();
  const server = app.withTypeProvider<ZodTypeProvider>();

  // 1. List Distilled Skills (legacy & synthesized)
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

  // 2. Full Organised Skills Library & Catalog (SQLite + JSON)
  server.get(
    `${prefix}/library`,
    {
      schema: {
        querystring: z.object({
          category: z.string().optional(),
        }),
        response: {
          200: skillCatalogSchema,
        },
        tags: ["Skills System"],
      },
    },
    async (request, reply) => {
      const catalog = organiserService.exportJsonCatalog();
      if (request.query.category && request.query.category !== "all") {
        return reply.send({
          ...catalog,
          skills: catalog.skills.filter((s) => s.category === request.query.category),
        });
      }
      return reply.send(catalog);
    },
  );

  // 3. Scan & Reindex Skills across repository
  server.post(
    `${prefix}/scan`,
    {
      schema: {
        body: scanSkillsInputSchema.optional(),
        response: {
          200: skillCatalogSchema,
        },
        tags: ["Skills System"],
      },
    },
    async (request, reply) => {
      const paths = request.body?.paths;
      const forceReindex = request.body?.forceReindex ?? false;
      const catalog = organiserService.scanAndIndex(paths, forceReindex);
      return reply.send(catalog);
    },
  );

  // 4. Recommend Skills for Prompt / Task Intent
  server.post(
    `${prefix}/recommend`,
    {
      schema: {
        body: recommendSkillsInputSchema,
        response: {
          200: z.array(skillRecommendationSchema),
        },
        tags: ["Skills System"],
      },
    },
    async (request, reply) => {
      const recs = organiserService.recommendSkills(request.body.prompt, request.body.limit);
      return reply.send(recs);
    },
  );

  // 5. Organize Skill (Categorize, Tag, Rate)
  server.post(
    `${prefix}/organize`,
    {
      schema: {
        body: organizeSkillInputSchema,
        response: {
          200: parsedSkillSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["Skills System"],
      },
    },
    async (request, reply) => {
      try {
        const updated = organiserService.organizeSkill(request.body);
        return reply.send(updated);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );

  // 6. Get Single Distilled Skill by Name or ID
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

  // 7. Distill Skill into Markdown & Repository
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
      // Also register into Organiser
      organiserService.scanAndIndex();
      return reply.code(201).send(skill);
    },
  );
}
