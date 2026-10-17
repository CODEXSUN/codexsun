import { z } from "zod";
export const deploymentRecordSchema = z.strictObject({
  uuid: z.string().length(8),
  revision: z.number().int(),
  version: z.number().int(),
  checksum: z.string(),
  status: z.enum(["queued", "running", "live", "failed", "superseded"]),
  actor: z.string(),
  attempts: z.number().int(),
  error: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deployedAt: z.string().nullable()
});
export const deploymentStateSchema = z.strictObject({
  enabled: z.boolean(),
  target: z.string(),
  latest: deploymentRecordSchema.nullable(),
  lastLive: deploymentRecordSchema.nullable(),
  history: z.array(deploymentRecordSchema)
});
export type DeploymentState = z.infer<typeof deploymentStateSchema>;
