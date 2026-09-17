import { z } from "zod";

export const orchestrationStateSchema = z.enum([
  "draft",
  "development-ready",
  "preview-requested",
  "preview-ready",
  "verification-running",
  "verification-passed",
  "approval-requested",
  "approved",
  "production-queued",
  "deploying",
  "live-verified",
  "verification-failed",
  "rejected",
  "deployment-failed",
  "rolled-back",
]);

export const orchestrationAttemptSchema = z.object({
  id: z.string().trim().min(1).max(120),
  revision: z.string().trim().min(7).max(120),
  targetId: z.string().trim().min(1).max(120),
  state: orchestrationStateSchema,
});

export type OrchestrationAttempt = z.infer<typeof orchestrationAttemptSchema>;
export type OrchestrationState = z.infer<typeof orchestrationStateSchema>;

export const verificationCheckKindSchema = z.enum(["static", "api", "browser", "data"]);
export const verificationCheckOutcomeSchema = z.enum(["passed", "failed"]);

const safeReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^[A-Za-z0-9._:/-]+$/u);

export const verificationCheckSchema = z.object({
  id: z.string().trim().min(1).max(120),
  kind: verificationCheckKindSchema,
  required: z.boolean(),
  outcome: verificationCheckOutcomeSchema,
  reference: safeReferenceSchema,
  evidenceReference: safeReferenceSchema,
  completedAt: z.string().datetime(),
});

export const recordedOrchestrationAttemptSchema = orchestrationAttemptSchema.extend({
  checks: z.array(verificationCheckSchema),
});

export type RecordedOrchestrationAttempt = z.infer<typeof recordedOrchestrationAttemptSchema>;
export type VerificationCheck = z.infer<typeof verificationCheckSchema>;
