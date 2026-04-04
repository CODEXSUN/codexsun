import { z } from "zod"

export const systemUpdateStatusSchema = z.object({
  rootPath: z.string().min(1),
  branch: z.string().min(1),
  upstream: z.string().nullable(),
  currentCommit: z.string().min(1),
  remoteCommit: z.string().nullable(),
  isClean: z.boolean(),
  hasRemoteUpdate: z.boolean(),
  canAutoUpdate: z.boolean(),
  canForceReset: z.boolean(),
  localChanges: z.array(z.string()),
  preflight: z.object({
    gitAvailable: z.boolean(),
    npmAvailable: z.boolean(),
    repoWritable: z.boolean(),
    issues: z.array(z.string()),
  }),
})

export const systemUpdateRunResponseSchema = z.object({
  updated: z.boolean(),
  restartScheduled: z.boolean(),
  rolledBack: z.boolean(),
  currentCommit: z.string().min(1),
  previousCommit: z.string().min(1),
  message: z.string().min(1),
  status: systemUpdateStatusSchema,
})

export const systemUpdateResetPayloadSchema = z.object({
  force: z.literal(true),
})

export const systemUpdateHistoryEntrySchema = z.object({
  timestamp: z.string().min(1),
  action: z.enum(["update", "reset"]),
  result: z.enum(["success", "failure", "blocked"]),
  message: z.string().min(1),
  previousCommit: z.string().min(1).nullable(),
  currentCommit: z.string().min(1).nullable(),
  actor: z.string().nullable(),
})

export const systemUpdateHistorySchema = z.object({
  items: z.array(systemUpdateHistoryEntrySchema),
})

export type SystemUpdateStatus = z.infer<typeof systemUpdateStatusSchema>
export type SystemUpdateRunResponse = z.infer<typeof systemUpdateRunResponseSchema>
export type SystemUpdateResetPayload = z.infer<typeof systemUpdateResetPayloadSchema>
export type SystemUpdateHistoryEntry = z.infer<typeof systemUpdateHistoryEntrySchema>
export type SystemUpdateHistory = z.infer<typeof systemUpdateHistorySchema>
