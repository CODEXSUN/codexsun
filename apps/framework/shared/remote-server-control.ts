import { z } from "zod"

import { systemUpdateRunResponseSchema, systemUpdateStatusSchema } from "./system-update.js"

export const remoteGitUpdateRequestSchema = z.object({
  overrideDirty: z.boolean().optional().default(false),
})

export const remoteGitUpdateResponseSchema = z.object({
  mode: z.enum(["clean_update", "override_dirty_update"]),
  overrideDirty: z.boolean(),
  beforeStatus: systemUpdateStatusSchema,
  update: systemUpdateRunResponseSchema,
})

export type RemoteGitUpdateRequest = z.infer<typeof remoteGitUpdateRequestSchema>
export type RemoteGitUpdateResponse = z.infer<typeof remoteGitUpdateResponseSchema>
