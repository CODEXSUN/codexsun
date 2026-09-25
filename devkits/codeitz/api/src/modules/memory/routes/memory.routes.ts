import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createMemoryEntryInputSchema,
  memoryBankDocumentSchema,
  memoryBankSectionEnum,
  memoryBankStateSchema,
  memoryEntrySchema,
  queryMemoriesInputSchema,
  synthesizeContextInputSchema,
  synthesizedContextResultSchema,
  updateMemorySectionInputSchema,
} from "../contracts/memory-contracts.js";
import { MemoryBankService } from "../service/memory-bank.service.js";

export function registerMemoryRoutes(
  app: FastifyInstance,
  service: MemoryBankService,
  prefix: string = "/api/v1/codeitz/memory",
): void {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get full memory bank state
  server.get(
    `${prefix}`,
    {
      schema: {
        querystring: z.object({
          projectId: z.string().optional().default("global"),
        }),
        response: {
          200: memoryBankStateSchema,
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const state = service.getMemoryBank(request.query.projectId);
      return reply.send(state);
    },
  );

  // Read single section
  server.get(
    `${prefix}/sections/:section`,
    {
      schema: {
        params: z.object({ section: memoryBankSectionEnum }),
        querystring: z.object({
          projectId: z.string().optional().default("global"),
        }),
        response: {
          200: z.object({ section: memoryBankSectionEnum, content: z.string() }),
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const content = service.readSection(request.params.section, request.query.projectId);
      return reply.send({ section: request.params.section, content });
    },
  );

  // Update section
  server.post(
    `${prefix}/sections`,
    {
      schema: {
        body: updateMemorySectionInputSchema,
        response: {
          200: memoryBankDocumentSchema,
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const doc = service.updateSection(
        request.body.section,
        request.body.content,
        request.body.projectId,
      );
      return reply.send(doc);
    },
  );

  // Query structured SQLite memories
  server.get(
    `${prefix}/entries`,
    {
      schema: {
        querystring: queryMemoriesInputSchema,
        response: {
          200: z.array(memoryEntrySchema),
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const entries = service.queryEntries(request.query);
      return reply.send(entries);
    },
  );

  // Create structured SQLite memory entry
  server.post(
    `${prefix}/entries`,
    {
      schema: {
        body: createMemoryEntryInputSchema,
        response: {
          201: memoryEntrySchema,
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const entry = service.createEntry(request.body);
      return reply.code(201).send(entry);
    },
  );

  // Delete memory entry
  server.delete(
    `${prefix}/entries/:id`,
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ success: z.boolean(), id: z.string() }),
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const success = service.deleteEntry(request.params.id);
      return reply.send({ success, id: request.params.id });
    },
  );

  // Synthesize context for agent/runner
  server.post(
    `${prefix}/synthesize`,
    {
      schema: {
        body: synthesizeContextInputSchema,
        response: {
          200: synthesizedContextResultSchema,
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const result = service.synthesizeContext(request.body);
      return reply.send(result);
    },
  );

  // Tri-format sync (Markdown, SQLite, JSON)
  server.post(
    `${prefix}/sync`,
    {
      schema: {
        body: z.object({ projectId: z.string().optional().default("global") }),
        response: {
          200: memoryBankStateSchema,
        },
        tags: ["Memory Bank"],
      },
    },
    async (request, reply) => {
      const state = service.syncAll(request.body.projectId);
      return reply.send(state);
    },
  );
}
