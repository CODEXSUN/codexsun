import { z } from 'zod'

const requiredString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().optional().transform((value) => {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
})
const jsonRecordSchema = z.record(z.string(), z.unknown())

export const mailboxRecipientTypeSchema = z.enum(['to', 'cc', 'bcc'])
export const mailboxMessageStatusSchema = z.enum(['queued', 'sent', 'failed'])

export const mailboxRecipientSchema = z.object({
  id: z.string().min(1),
  messageId: z.string().min(1),
  recipientType: mailboxRecipientTypeSchema,
  email: z.email(),
  name: z.string().nullable(),
  createdAt: z.string().min(1),
})

export const mailboxTemplateSummarySchema = z.object({
  id: z.string().min(1),
  code: requiredString,
  name: requiredString,
  category: requiredString,
  description: z.string().nullable(),
  subjectTemplate: requiredString,
  isSystem: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mailboxTemplateSchema = mailboxTemplateSummarySchema.extend({
  htmlTemplate: z.string().nullable(),
  textTemplate: z.string().nullable(),
  sampleData: jsonRecordSchema.nullable(),
})

export const mailboxMessageSummarySchema = z.object({
  id: z.string().min(1),
  subject: requiredString,
  templateCode: z.string().nullable(),
  fromEmail: z.email(),
  fromName: z.string().nullable(),
  recipientSummary: z.string().min(1),
  recipientCount: z.number().int().nonnegative(),
  status: mailboxMessageStatusSchema,
  provider: z.string().nullable(),
  providerMessageId: z.string().nullable(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  sentAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mailboxMessageSchema = mailboxMessageSummarySchema.extend({
  replyTo: z.string().nullable(),
  htmlBody: z.string().nullable(),
  textBody: z.string().nullable(),
  metadata: jsonRecordSchema.nullable(),
  recipients: z.array(mailboxRecipientSchema),
})

export const mailboxTemplateUpsertPayloadSchema = z.object({
  code: requiredString,
  name: requiredString,
  category: requiredString,
  description: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  subjectTemplate: requiredString,
  htmlTemplate: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  textTemplate: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  sampleData: jsonRecordSchema.nullable().optional().default(null),
  isSystem: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
})

export const mailboxRecipientInputSchema = z.object({
  email: z.email(),
  name: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
})

export const mailboxSendPayloadSchema = z.object({
  to: z.array(mailboxRecipientInputSchema).min(1),
  cc: z.array(mailboxRecipientInputSchema).optional().default([]),
  bcc: z.array(mailboxRecipientInputSchema).optional().default([]),
  subject: optionalTrimmedString,
  htmlBody: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  textBody: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  templateId: optionalTrimmedString,
  templateCode: optionalTrimmedString,
  templateData: jsonRecordSchema.optional().default({}),
  referenceType: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  referenceId: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  replyTo: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  fromName: z.string().trim().nullable().optional().transform((value) => value?.trim() || null),
  fromEmail: z.email().optional(),
})

export const mailboxTemplateListResponseSchema = z.object({
  items: z.array(mailboxTemplateSummarySchema),
})

export const mailboxTemplateResponseSchema = z.object({
  item: mailboxTemplateSchema,
})

export const mailboxMessageListResponseSchema = z.object({
  items: z.array(mailboxMessageSummarySchema),
})

export const mailboxMessageResponseSchema = z.object({
  item: mailboxMessageSchema,
})

export type MailboxRecipientType = z.infer<typeof mailboxRecipientTypeSchema>
export type MailboxMessageStatus = z.infer<typeof mailboxMessageStatusSchema>
export type MailboxRecipient = z.infer<typeof mailboxRecipientSchema>
export type MailboxRecipientInput = z.infer<typeof mailboxRecipientInputSchema>
export type MailboxTemplateSummary = z.infer<typeof mailboxTemplateSummarySchema>
export type MailboxTemplate = z.infer<typeof mailboxTemplateSchema>
export type MailboxTemplateUpsertPayload = z.infer<typeof mailboxTemplateUpsertPayloadSchema>
export type MailboxSendPayload = z.infer<typeof mailboxSendPayloadSchema>
export type MailboxMessageSummary = z.infer<typeof mailboxMessageSummarySchema>
export type MailboxMessage = z.infer<typeof mailboxMessageSchema>
export type MailboxTemplateListResponse = z.infer<typeof mailboxTemplateListResponseSchema>
export type MailboxTemplateResponse = z.infer<typeof mailboxTemplateResponseSchema>
export type MailboxMessageListResponse = z.infer<typeof mailboxMessageListResponseSchema>
export type MailboxMessageResponse = z.infer<typeof mailboxMessageResponseSchema>
