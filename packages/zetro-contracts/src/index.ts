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

export const zetroCreateChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
});

export type ZetroChatConversation = z.infer<typeof zetroChatConversationSchema>;
export type ZetroChatMessage = z.infer<typeof zetroChatMessageSchema>;
export type ZetroChatRole = z.infer<typeof zetroChatRoleSchema>;
