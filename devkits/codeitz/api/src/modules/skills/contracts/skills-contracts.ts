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
