import { z } from "zod";
export const knowledgeSchema = z
  .object({
    body: z.string().max(128000, "The Markdown body is too large").nullable(),
    expectedRevision: z.number().int().positive()
  })
  .strict();
