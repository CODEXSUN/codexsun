import { z } from 'zod'

const connectionSchema = z.strictObject({
  email: z.string().optional(),
  message: z.string().optional(),
  mode: z.enum(['api_key', 'chatgpt', 'none']),
  planType: z.string().optional(),
  state: z.enum(['connected', 'disconnected', 'error', 'pending']),
})

export const connectionResponseSchema = z.strictObject({ connection: connectionSchema })

export const deviceCodeResponseSchema = z.strictObject({
  deviceCode: z.strictObject({
    loginId: z.string().min(1),
    userCode: z.string().min(1),
    verificationUrl: z.url(),
  }),
})
