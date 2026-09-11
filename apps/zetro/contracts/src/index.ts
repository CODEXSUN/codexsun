import { z } from 'zod'

export const chatConversationHeaderName = 'x-zetro-conversation-id'
export const chatConversationIdSchema = z.uuid()
export const chatConversationTitleSchema = z.string().trim().min(1).max(120)

export const providerConnectionIdSchema = z.string().trim().min(1).max(80)
export const providerKindSchema = z.enum(['codex-app-server', 'cxz-codex'])
export const providerAuthStatusSchema = z.enum([
  'unknown',
  'authenticated',
  'not-authenticated',
  'pending',
  'error',
])
export const providerReasoningEffortSchema = z.enum([
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
  'ultra',
])

export const providerConnectionSchema = z.object({
  accountLabel: z.string().optional(),
  authStatus: providerAuthStatusSchema,
  baseUrl: z.string().url().optional(),
  enabled: z.boolean(),
  id: providerConnectionIdSchema,
  kind: providerKindSchema,
  label: z.string().min(1).max(80),
  model: z.string().min(1).max(160).optional(),
  reasoningEffort: providerReasoningEffortSchema,
  updatedAt: z.number().int().nonnegative(),
})

export const providerSelectionRequestSchema = z.object({
  connectionId: providerConnectionIdSchema,
  model: z.string().trim().min(1).max(160).optional(),
  reasoningEffort: providerReasoningEffortSchema,
})

export const providerSelectionConfirmationSchema = z.object({
  accountLabel: z.string().optional(),
  confirmedAt: z.number().int().nonnegative(),
  connected: z.literal(true),
  connectionId: providerConnectionIdSchema,
  model: z.string().min(1).max(160),
  providerLabel: z.string().min(1).max(80),
  reasoningEffort: providerReasoningEffortSchema,
  runtime: z.enum(['local', 'cxz']),
  smoke: z.object({
    completedAt: z.number().int().nonnegative(),
    latencyMs: z.number().int().nonnegative(),
    ok: z.literal(true),
    response: z.literal('ZETRO_SMOKE_OK'),
  }),
})

export const providerSettingsResponseSchema = z.object({
  confirmation: providerSelectionConfirmationSchema.optional(),
  connections: z.array(providerConnectionSchema),
  selectedConnectionId: providerConnectionIdSchema,
})

export const providerModelSchema = z.object({
  description: z.string(),
  displayName: z.string(),
  id: z.string().min(1),
  isDefault: z.boolean(),
  supportedReasoningEfforts: z.array(providerReasoningEffortSchema),
})

export const providerModelListResponseSchema = z.object({ models: z.array(providerModelSchema) })

export const providerDeviceLoginResponseSchema = z.object({
  loginId: z.string().min(1),
  userCode: z.string().min(1),
  verificationUrl: z.string().url(),
})

export const providerConnectionParamsSchema = z.object({
  connectionId: providerConnectionIdSchema,
})

export const providerConnectionTestResponseSchema = z.object({
  message: z.string(),
  ok: z.boolean(),
})

export const chatConversationListScopeSchema = z.enum(['active', 'archived', 'all'])

export const chatConversationParamsSchema = z.object({ conversationId: chatConversationIdSchema })

export const chatConversationCreateRequestSchema = z.object({
  title: chatConversationTitleSchema.optional(),
})

export const chatConversationUpdateRequestSchema = z
  .object({
    archived: z.boolean().optional(),
    title: chatConversationTitleSchema.optional(),
  })
  .refine((value) => value.archived !== undefined || value.title !== undefined, {
    message: 'A title or archive state is required.',
  })

export const chatConversationProviderStatusSchema = z.enum(['unverified', 'verified'])

export const chatConversationProviderSchema = providerSelectionRequestSchema.extend({
  latencyMs: z.number().int().nonnegative().optional(),
  status: chatConversationProviderStatusSchema,
  verifiedAt: z.number().int().nonnegative().optional(),
})

export const chatConversationProviderResponseSchema = z.object({
  confirmation: providerSelectionConfirmationSchema.optional(),
  conversationId: chatConversationIdSchema,
  provider: chatConversationProviderSchema,
})

export const chatConversationListQuerySchema = z.object({
  scope: chatConversationListScopeSchema.default('active'),
})

export const chatTurnStatusSchema = z.enum(['working', 'complete', 'stopped', 'failed'])

export const chatTurnProviderSnapshotSchema = z.object({
  connectionId: providerConnectionIdSchema,
  kind: providerKindSchema,
  label: z.string().min(1).max(80),
  model: z.string().min(1).max(160).optional(),
  reasoningEffort: providerReasoningEffortSchema,
})

export const chatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ content: z.string(), type: z.literal('request') }),
  z.object({ delta: z.string(), type: z.literal('response') }),
  z.object({
    item: z.record(z.string(), z.unknown()),
    method: z.string(),
    type: z.literal('activity'),
  }),
  z.object({ type: z.literal('complete') }),
  z.object({ type: z.literal('stopped') }),
  z.object({ message: z.string(), type: z.literal('error') }),
])

export const chatPromptRequestSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(64 * 1024),
  turnId: z.uuid(),
})

export const chatStopRequestSchema = z.object({ turnId: z.uuid() })

export const chatTurnParamsSchema = z.object({ turnId: z.uuid() })

export const chatEventStreamQuerySchema = z.object({
  after: z.coerce.number().int().nonnegative().default(0),
})

export const chatTurnAcceptedResponseSchema = z.object({
  conversationId: chatConversationIdSchema,
  status: z.literal('working'),
  turnId: z.uuid(),
})

export const storedChatEventSchema = z.object({
  event: chatStreamEventSchema,
  sequence: z.number().int().positive(),
})

export const storedChatTurnSchema = z.object({
  completedAt: z.number().int().nonnegative().optional(),
  connection: chatTurnProviderSnapshotSchema.optional(),
  events: z.array(storedChatEventSchema),
  id: z.uuid(),
  prompt: z.string(),
  startedAt: z.number().int().nonnegative(),
  status: chatTurnStatusSchema,
})

export const chatHistoryResponseSchema = z.object({
  conversationId: chatConversationIdSchema,
  turns: z.array(storedChatTurnSchema),
})

export const chatConversationSummarySchema = z.object({
  archivedAt: z.number().int().nonnegative().optional(),
  createdAt: z.number().int().nonnegative(),
  id: chatConversationIdSchema,
  lastTurnStatus: chatTurnStatusSchema.optional(),
  provider: chatConversationProviderSchema,
  title: chatConversationTitleSchema,
  turnCount: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
})

export const chatConversationListResponseSchema = z.object({
  conversations: z.array(chatConversationSummarySchema),
})

export const agentTaskApprovalStatusSchema = z.literal('awaiting-approval')
export const agentTaskStatusSchema = z.literal('draft')
export const agentTaskIdSchema = z.uuid()

export const agentTaskFromChatRequestSchema = z.object({
  conversationId: chatConversationIdSchema,
  turnId: z.uuid(),
})

export const agentTaskParamsSchema = z.object({ taskId: agentTaskIdSchema })

export const agentTaskDraftSchema = z.object({
  approvalStatus: agentTaskApprovalStatusSchema,
  createdAt: z.number().int().nonnegative(),
  id: agentTaskIdSchema,
  originConversationId: chatConversationIdSchema,
  originTurnId: z.uuid(),
  sourcePrompt: z.string(),
  sourceResponse: z.string().min(1),
  status: agentTaskStatusSchema,
  title: z.string().trim().min(1).max(120),
  updatedAt: z.number().int().nonnegative(),
})

export const agentTaskSummarySchema = agentTaskDraftSchema.omit({
  sourcePrompt: true,
  sourceResponse: true,
})

export const agentTaskListResponseSchema = z.object({ tasks: z.array(agentTaskSummarySchema) })

export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>
export type ChatConversationListScope = z.infer<typeof chatConversationListScopeSchema>
export type ChatConversationSummary = z.infer<typeof chatConversationSummarySchema>
export type ChatConversationProvider = z.infer<typeof chatConversationProviderSchema>
export type ChatConversationProviderResponse = z.infer<
  typeof chatConversationProviderResponseSchema
>
export type ChatConversationUpdateRequest = z.infer<typeof chatConversationUpdateRequestSchema>
export type ChatStoredEvent = z.infer<typeof storedChatEventSchema>
export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>
export type ChatTurnAcceptedResponse = z.infer<typeof chatTurnAcceptedResponseSchema>
export type ChatTurnStatus = z.infer<typeof chatTurnStatusSchema>
export type StoredChatTurn = z.infer<typeof storedChatTurnSchema>
export type ChatTurnProviderSnapshot = z.infer<typeof chatTurnProviderSnapshotSchema>
export type ProviderAuthStatus = z.infer<typeof providerAuthStatusSchema>
export type ProviderConnection = z.infer<typeof providerConnectionSchema>
export type ProviderConnectionTestResponse = z.infer<typeof providerConnectionTestResponseSchema>
export type ProviderDeviceLoginResponse = z.infer<typeof providerDeviceLoginResponseSchema>
export type ProviderKind = z.infer<typeof providerKindSchema>
export type ProviderModel = z.infer<typeof providerModelSchema>
export type ProviderReasoningEffort = z.infer<typeof providerReasoningEffortSchema>
export type ProviderSelectionRequest = z.infer<typeof providerSelectionRequestSchema>
export type ProviderSelectionConfirmation = z.infer<typeof providerSelectionConfirmationSchema>
export type ProviderSettingsResponse = z.infer<typeof providerSettingsResponseSchema>
export type AgentTaskDraft = z.infer<typeof agentTaskDraftSchema>
export type AgentTaskFromChatRequest = z.infer<typeof agentTaskFromChatRequestSchema>
export type AgentTaskSummary = z.infer<typeof agentTaskSummarySchema>

export function encodeChatServerEvent(event: ChatStoredEvent) {
  return `id: ${event.sequence}\nevent: chat\ndata: ${JSON.stringify(event)}\n\n`
}

export function parseChatServerEvent(data: string): ChatStoredEvent {
  return storedChatEventSchema.parse(JSON.parse(data) as unknown)
}
