import { z } from 'zod'

export const activateDeviceCodeSchema = z.strictObject({
  loginId: z.string().uuid(),
  userCode: z.string().trim().min(4).max(32),
})

export const disconnectCodexSchema = z.strictObject({
  confirm: z.literal(true),
})
