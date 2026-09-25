import { z } from "zod";

export const skillDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  scope: z.string().min(1),
  inputs: z.array(z.string()).default([]),
  workflow: z.array(z.string()).default([]),
  verificationCriteria: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  markdown: z.string().min(1),
  synthesizedFromExperienceId: z.string().optional(),
  createdAt: z.string(),
});
export type SkillDefinition = z.infer<typeof skillDefinitionSchema>;

export const skillDistillationRequestSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/u, "Name must be lowercase kebab-case"),
  description: z.string().min(1),
  domain: z.string().min(1),
  problemSummary: z.string().min(1),
  verifiedSteps: z.array(z.string()).min(1),
  verificationChecks: z.array(z.string()).min(1),
  guardrails: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  experienceId: z.string().optional(),
});
export type SkillDistillationRequest = z.infer<typeof skillDistillationRequestSchema>;

// Parsed & Organised Skill Schemas
export const parsedSkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.string().default("general"),
  domain: z.string().default("software-engineering"),
  tags: z.array(z.string()).default([]),
  sourcePath: z.string().default(""),
  workflow: z.array(z.string()).default([]),
  verificationCriteria: z.array(z.string()).default([]),
  guardrails: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  markdown: z.string().min(1),
  scripts: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  valid: z.boolean().default(true),
  validationErrors: z.array(z.string()).default([]),
  rating: z.number().int().min(1).max(10).default(5),
  usageCount: z.number().int().default(0),
  updatedAt: z.string(),
});
export type ParsedSkill = z.infer<typeof parsedSkillSchema>;

export const scanSkillsInputSchema = z.object({
  paths: z.array(z.string()).optional(),
  forceReindex: z.boolean().optional().default(false),
});
export type ScanSkillsInput = z.infer<typeof scanSkillsInputSchema>;

export const skillRecommendationSchema = z.object({
  skill: parsedSkillSchema,
  score: z.number(),
  reason: z.string(),
  matchedKeywords: z.array(z.string()),
});
export type SkillRecommendation = z.infer<typeof skillRecommendationSchema>;

export const recommendSkillsInputSchema = z.object({
  prompt: z.string().min(1),
  limit: z.coerce.number().int().positive().optional().default(3),
});
export type RecommendSkillsInput = z.infer<typeof recommendSkillsInputSchema>;

export const organizeSkillInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().int().min(1).max(10).optional(),
});
export type OrganizeSkillInput = z.infer<typeof organizeSkillInputSchema>;

export const skillCatalogCategorySchema = z.object({
  name: z.string(),
  count: z.number(),
});

export const skillCatalogSchema = z.object({
  totalCount: z.number(),
  categories: z.array(skillCatalogCategorySchema),
  skills: z.array(parsedSkillSchema),
  lastScannedAt: z.string(),
});
export type SkillCatalog = z.infer<typeof skillCatalogSchema>;
