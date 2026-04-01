import { z } from 'zod'

export const databaseSetupPayloadSchema = z.object({
  host: z.string().trim().min(1),
  port: z.coerce.number().int().positive().max(65535),
  user: z.string().trim().min(1),
  password: z.string().default(''),
  name: z.string().trim().min(1),
})

export const setupDatabaseSummarySchema = z.object({
  configured: z.boolean(),
  source: z.enum(['env_file', 'none']),
  host: z.string().min(1).nullable(),
  port: z.number().int().positive().nullable(),
  user: z.string().min(1).nullable(),
  name: z.string().min(1).nullable(),
})

export const setupStatusSchema = z.object({
  status: z.enum(['ready', 'required', 'error']),
  checkedAt: z.string().min(1),
  detail: z.string().min(1),
  database: setupDatabaseSummarySchema,
})

export const setupStatusResponseSchema = z.object({
  status: setupStatusSchema,
})

export type DatabaseSetupPayload = z.infer<typeof databaseSetupPayloadSchema>
export type SetupDatabaseSummary = z.infer<typeof setupDatabaseSummarySchema>
export type SetupStatus = z.infer<typeof setupStatusSchema>
export type SetupStatusResponse = z.infer<typeof setupStatusResponseSchema>
