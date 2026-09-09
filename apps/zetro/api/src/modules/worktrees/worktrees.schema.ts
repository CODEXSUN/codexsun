import { z } from 'zod'

export const removeWorktreeSchema = z.strictObject({ path: z.string().min(1).max(4_096) })
export const sweepWorktreesSchema = z.strictObject({
  retentionDays: z.number().int().min(1).max(365).default(30),
})
