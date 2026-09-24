import { z } from "zod";

export const sweTaskPhaseSchema = z.enum([
  "intake",
  "grounding",
  "planning",
  "execution",
  "verification",
  "review",
  "completed",
  "failed",
]);

export type SweTaskPhase = z.infer<typeof sweTaskPhaseSchema>;

export const sweTaskStatusSchema = z.enum([
  "queued",
  "in_progress",
  "verified",
  "rejected",
  "completed",
  "failed",
]);

export type SweTaskStatus = z.infer<typeof sweTaskStatusSchema>;

export const sweVerificationCheckSchema = z.object({
  name: z.string().min(1),
  passed: z.boolean(),
  output: z.string().default(""),
  durationMs: z.number().nonnegative().default(0),
});

export type SweVerificationCheck = z.infer<typeof sweVerificationCheckSchema>;

export const sweTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  prompt: z.string().min(1),
  phase: sweTaskPhaseSchema,
  status: sweTaskStatusSchema,
  targetPaths: z.array(z.string()).default([]),
  changeSummary: z.string().default(""),
  verificationChecks: z.array(sweVerificationCheckSchema).default([]),
  reviewNotes: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SweTask = z.infer<typeof sweTaskSchema>;

export const createSweTaskInputSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  targetPaths: z.array(z.string()).optional(),
});

export type CreateSweTaskInput = z.infer<typeof createSweTaskInputSchema>;

export const advancePhaseInputSchema = z.object({
  targetPhase: sweTaskPhaseSchema,
  evidence: z.string().default(""),
  targetPaths: z.array(z.string()).optional(),
  changeSummary: z.string().optional(),
});

export type AdvancePhaseInput = z.infer<typeof advancePhaseInputSchema>;

export const runVerificationInputSchema = z.object({
  checks: z.array(sweVerificationCheckSchema),
});

export type RunVerificationInput = z.infer<typeof runVerificationInputSchema>;
