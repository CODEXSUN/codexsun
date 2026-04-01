import { z } from 'zod'

export const supportAssistantServiceStatusSchema = z.enum(['disabled', 'offline', 'indexing', 'ready', 'error'])

export const supportAssistantSourceSchema = z.object({
  filePath: z.string().min(1),
  module: z.string().min(1),
  topic: z.string().min(1),
  sourceType: z.string().min(1),
  score: z.number(),
  snippet: z.string().min(1),
})

export const supportAssistantStatusSchema = z.object({
  status: supportAssistantServiceStatusSchema,
  assistantName: z.string().min(1),
  summary: z.string().min(1),
  codexsunUrl: z.string().min(1).nullable(),
  indexedFiles: z.number().int().nonnegative(),
  indexedChunks: z.number().int().nonnegative(),
  inProgress: z.boolean(),
  lastIndexedAt: z.string().nullable(),
  lastError: z.string().nullable(),
})

export const supportAssistantStatusResponseSchema = z.object({
  assistant: supportAssistantStatusSchema,
})

export const supportAssistantChatRequestPayloadSchema = z.object({
  message: z.string().trim().min(1),
  pagePath: z.string().trim().min(1).nullable().optional(),
  workspace: z.string().trim().min(1).nullable().optional(),
})

export const supportAssistantChatResponseSchema = z.object({
  answer: z.string().min(1),
  sources: z.array(supportAssistantSourceSchema),
  assistant: supportAssistantStatusSchema,
})

export type SupportAssistantServiceStatus = z.infer<typeof supportAssistantServiceStatusSchema>
export type SupportAssistantSource = z.infer<typeof supportAssistantSourceSchema>
export type SupportAssistantStatus = z.infer<typeof supportAssistantStatusSchema>
export type SupportAssistantStatusResponse = z.infer<typeof supportAssistantStatusResponseSchema>
export type SupportAssistantChatRequestPayload = z.infer<typeof supportAssistantChatRequestPayloadSchema>
export type SupportAssistantChatResponse = z.infer<typeof supportAssistantChatResponseSchema>
