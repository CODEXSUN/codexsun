import { z } from "zod";

export const memoryBankSectionEnum = z.enum([
  "productContext",
  "activeContext",
  "systemPatterns",
  "techContext",
  "progress",
]);
export type MemoryBankSection = z.infer<typeof memoryBankSectionEnum>;

export const memoryBankDocumentSchema = z.object({
  section: memoryBankSectionEnum,
  title: z.string(),
  markdown: z.string(),
  filePath: z.string(),
  updatedAt: z.string(),
});
export type MemoryBankDocument = z.infer<typeof memoryBankDocumentSchema>;

export const memoryEntryCategoryEnum = z.enum([
  "product",
  "active",
  "pattern",
  "tech",
  "progress",
  "task_fact",
  "custom",
]);
export type MemoryEntryCategory = z.infer<typeof memoryEntryCategoryEnum>;

export const memoryEntrySchema = z.object({
  id: z.string(),
  projectId: z.string().default("global"),
  category: memoryEntryCategoryEnum,
  key: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  importance: z.number().int().min(1).max(10).default(5),
  source: z.enum(["user", "system", "agent", "verification"]).default("system"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MemoryEntry = z.infer<typeof memoryEntrySchema>;

export const memoryBankStateSchema = z.object({
  projectId: z.string(),
  productContext: z.string(),
  activeContext: z.string(),
  systemPatterns: z.string(),
  techContext: z.string(),
  progress: z.string(),
  entries: z.array(memoryEntrySchema).default([]),
  stats: z.object({
    totalEntries: z.number(),
    sectionsCount: z.number(),
    sqliteConnected: z.boolean(),
  }),
  lastSyncAt: z.string(),
});
export type MemoryBankState = z.infer<typeof memoryBankStateSchema>;

export const updateMemorySectionInputSchema = z.object({
  projectId: z.string().optional().default("global"),
  section: memoryBankSectionEnum,
  content: z.string().min(1),
});
export type UpdateMemorySectionInput = z.infer<typeof updateMemorySectionInputSchema>;

export const createMemoryEntryInputSchema = z.object({
  projectId: z.string().optional().default("global"),
  category: memoryEntryCategoryEnum.default("active"),
  key: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  importance: z.number().int().min(1).max(10).optional().default(5),
  source: z.enum(["user", "system", "agent", "verification"]).optional().default("system"),
});
export type CreateMemoryEntryInput = {
  projectId?: string;
  category: MemoryEntryCategory;
  key: string;
  content: string;
  tags?: string[];
  importance?: number;
  source?: "user" | "system" | "agent" | "verification";
};

export const queryMemoriesInputSchema = z.object({
  projectId: z.string().optional(),
  category: memoryEntryCategoryEnum.optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  minImportance: z.coerce.number().int().min(1).max(10).optional(),
  limit: z.coerce.number().int().positive().default(50).optional(),
});
export type QueryMemoriesInput = {
  projectId?: string;
  category?: MemoryEntryCategory;
  tag?: string;
  search?: string;
  minImportance?: number;
  limit?: number;
};

export const synthesizeContextInputSchema = z.object({
  prompt: z.string().min(1),
  projectId: z.string().optional().default("global"),
  includeSections: z.array(memoryBankSectionEnum).optional(),
});
export type SynthesizeContextInput = z.infer<typeof synthesizeContextInputSchema>;

export const synthesizedContextResultSchema = z.object({
  prompt: z.string(),
  groundedContext: z.string(),
  activeSectionsUsed: z.array(z.string()),
  matchedMemoryKeys: z.array(z.string()),
});
export type SynthesizedContextResult = z.infer<typeof synthesizedContextResultSchema>;
