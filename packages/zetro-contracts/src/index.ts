import { z } from "zod";

export const zetroApiVersion = "v1" as const;

export const zetroHealthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.literal("zetro"),
  providers: z.array(z.string()),
  database: z.enum(["ok", "unavailable"]),
});

export const zetroSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    version: z.literal(zetroApiVersion),
  });

export const zetroHealthResponseSchema = zetroSuccessSchema(zetroHealthSchema);

export type ZetroHealth = z.infer<typeof zetroHealthSchema>;
export type ZetroHealthResponse = z.infer<typeof zetroHealthResponseSchema>;

export interface ZetroSqliteReadiness {
  check(): Promise<boolean>;
}

export const zetroChatRoleSchema = z.enum(["user", "assistant", "error"]);

export const zetroChatConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messageCount: z.number().int().nonnegative(),
});

export const zetroChatMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: zetroChatRoleSchema,
  content: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const zetroChatConversationListResponseSchema = zetroSuccessSchema(
  z.object({ conversations: z.array(zetroChatConversationSchema) }),
);

export const zetroChatConversationResponseSchema = zetroSuccessSchema(
  z.object({
    conversation: zetroChatConversationSchema,
    messages: z.array(zetroChatMessageSchema),
  }),
);

export const zetroCreateConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const zetroCodexModelSchema = z.enum(["Default", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-6-astra"]);
export const zetroCodexReasoningSchema = z.enum(["Default", "Low", "Medium", "High", "XHigh"]);

export const zetroChatRuntimeSelectionSchema = z.object({
  provider: z.literal("Codex"),
  model: zetroCodexModelSchema,
  reasoning: zetroCodexReasoningSchema,
});

export const zetroCreateChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  runtime: zetroChatRuntimeSelectionSchema.optional(),
});

export const zetroChatRuntimeSchema = zetroChatRuntimeSelectionSchema.extend({
  connected: z.boolean(),
  message: z.string().min(1).max(500),
  models: z.array(zetroCodexModelSchema),
  providers: z.array(z.literal("Codex")),
  reasoningLevels: z.array(zetroCodexReasoningSchema),
});

export const zetroChatRuntimeResponseSchema = zetroSuccessSchema(zetroChatRuntimeSchema);

export const zetroChatStreamEventSchema = z.object({
  type: z.enum(["processing", "command", "response", "error", "complete"]),
  message: z.string().min(1).max(20_000),
  raw: z.string().max(20_000).optional(),
});

export type ZetroChatConversation = z.infer<typeof zetroChatConversationSchema>;
export type ZetroChatMessage = z.infer<typeof zetroChatMessageSchema>;
export type ZetroChatRole = z.infer<typeof zetroChatRoleSchema>;
export type ZetroChatStreamEvent = z.infer<typeof zetroChatStreamEventSchema>;
export type ZetroChatRuntime = z.infer<typeof zetroChatRuntimeSchema>;
export type ZetroChatRuntimeSelection = z.infer<typeof zetroChatRuntimeSelectionSchema>;
