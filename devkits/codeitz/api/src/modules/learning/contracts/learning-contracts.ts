import { z } from "zod";

export const experienceOutcomeSchema = z.enum(["success", "failure", "partial"]);
export type ExperienceOutcome = z.infer<typeof experienceOutcomeSchema>;

export const heuristicCategorySchema = z.enum([
  "guardrail",
  "strategy",
  "pattern",
  "anti-pattern",
]);
export type HeuristicCategory = z.infer<typeof heuristicCategorySchema>;

export const synthesizedHeuristicSchema = z.object({
  id: z.string().uuid(),
  category: heuristicCategorySchema,
  rule: z.string().min(1),
  triggerKeywords: z.array(z.string()),
  reinforcementCount: z.number().int().nonnegative().default(1),
  effectivenessScore: z.number().min(0).max(1).default(0.8),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SynthesizedHeuristic = z.infer<typeof synthesizedHeuristicSchema>;

export const engineeringExperienceSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  outcome: experienceOutcomeSchema,
  domain: z.string().min(1),
  symptoms: z.array(z.string()).default([]),
  rootCause: z.string().default(""),
  resolution: z.string().default(""),
  heuristicsLearned: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.85),
  createdAt: z.string(),
});
export type EngineeringExperience = z.infer<typeof engineeringExperienceSchema>;

export const recordExperienceInputSchema = z.object({
  taskId: z.string().uuid(),
  outcome: experienceOutcomeSchema,
  domain: z.string().min(1),
  symptoms: z.array(z.string()).optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  heuristicsLearned: z.array(z.string()).optional(),
});
export type RecordExperienceInput = z.infer<typeof recordExperienceInputSchema>;

export const queryHeuristicsInputSchema = z.object({
  prompt: z.string().min(1),
  domain: z.string().optional(),
});
export type QueryHeuristicsInput = z.infer<typeof queryHeuristicsInputSchema>;
