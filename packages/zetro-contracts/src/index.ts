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
export const zetroIdeaStageSchema = z.enum(["explore", "compare", "revise", "final"]);

export const zetroChatConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messageCount: z.number().int().nonnegative(),
  archived: z.boolean(),
  pinned: z.boolean(),
  stage: zetroIdeaStageSchema,
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

export const zetroUpdateConversationSchema = z.object({
  archived: z.boolean().optional(),
  pinned: z.boolean().optional(),
  stage: zetroIdeaStageSchema.optional(),
  title: z.string().trim().min(1).max(120).optional(),
}).refine((value) => value.archived !== undefined || value.pinned !== undefined || value.stage !== undefined || value.title !== undefined, "Provide a conversation update.");

export const zetroCodexModelSchema = z.string().trim().min(1).max(120);
export const zetroCodexReasoningSchema = z.enum(["Default", "Low", "Medium", "High", "XHigh"]);

export const zetroChatRuntimeSelectionSchema = z.object({
  provider: z.literal("Codex"),
  model: zetroCodexModelSchema,
  reasoning: zetroCodexReasoningSchema,
});

export const zetroCreateChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  attachments: z.array(z.object({ name: z.string().min(1).max(240), type: z.string().max(120), content: z.string().min(1).max(14_000_000) })).max(5).optional(),
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
export const zetroUpdateChatRuntimeSchema = zetroChatRuntimeSelectionSchema;

export const zetroCodexDeviceCodeSchema = z.object({
  message: z.string().min(1).max(500),
  status: z.enum(["idle", "awaiting", "connected", "failed"]),
  userCode: z.string().min(1).max(64).optional(),
  verificationUrl: z.string().url().optional(),
});

export const zetroCodexDeviceCodeResponseSchema = zetroSuccessSchema(zetroCodexDeviceCodeSchema);

export const zetroIdeaBriefSchema = z.object({
  audience: z.string().trim().max(1_000),
  constraints: z.string().trim().max(4_000),
  conversationId: z.string().uuid(),
  createdAt: z.string().datetime(),
  exclusions: z.string().trim().max(4_000),
  id: z.string().uuid(),
  outcome: z.string().trim().min(1).max(4_000),
  projectReference: z.string().trim().max(240).nullable(),
  projectScope: z.enum(["project", "all-projects"]),
  risks: z.string().trim().max(4_000),
  scope: z.string().trim().max(4_000),
  sourceMessageIds: z.array(z.string().uuid()).max(100),
  status: z.enum(["draft", "final"]),
  successSignals: z.string().trim().max(4_000),
  title: z.string().trim().min(1).max(160),
  updatedAt: z.string().datetime(),
}).superRefine((value, context) => {
  if (value.projectScope === "project" && !value.projectReference) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a referred project for project scope.", path: ["projectReference"] });
  }
  if (value.status === "final" && !value.sourceMessageIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Final briefs require at least one source response.", path: ["sourceMessageIds"] });
  }
});

export const zetroUpsertIdeaBriefSchema = z.object({
  audience: z.string().trim().max(1_000),
  constraints: z.string().trim().max(4_000),
  exclusions: z.string().trim().max(4_000),
  outcome: z.string().trim().min(1).max(4_000),
  projectReference: z.string().trim().max(240).nullable(),
  projectScope: z.enum(["project", "all-projects"]),
  risks: z.string().trim().max(4_000),
  scope: z.string().trim().max(4_000),
  sourceMessageIds: z.array(z.string().uuid()).max(100),
  status: z.enum(["draft", "final"]),
  successSignals: z.string().trim().max(4_000),
  title: z.string().trim().min(1).max(160),
}).superRefine((value, context) => {
  if (value.projectScope === "project" && !value.projectReference) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a referred project for project scope.", path: ["projectReference"] });
  }
  if (value.status === "final" && !value.sourceMessageIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Final briefs require at least one source response.", path: ["sourceMessageIds"] });
  }
});

export const zetroIdeaBriefResponseSchema = zetroSuccessSchema(z.object({ brief: zetroIdeaBriefSchema.nullable() }));

export const zetroAgentTaskSchema = z.object({
  briefId: z.string().uuid(),
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
  projectReference: z.string().trim().max(240).nullable(),
  projectScope: z.enum(["project", "all-projects"]),
  status: z.literal("prepared"),
  summary: z.string().trim().min(1).max(4_000),
  title: z.string().trim().min(1).max(160),
  updatedAt: z.string().datetime(),
});

export const zetroCreateAgentTaskSchema = z.object({
  briefId: z.string().uuid(),
  projectReference: z.string().trim().max(240).nullable(),
  projectScope: z.enum(["project", "all-projects"]),
  summary: z.string().trim().min(1).max(4_000),
  title: z.string().trim().min(1).max(160),
}).superRefine((value, context) => {
  if (value.projectScope === "project" && !value.projectReference) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a referred project for project scope.", path: ["projectReference"] });
  }
});

export const zetroAgentTaskListResponseSchema = zetroSuccessSchema(z.object({ tasks: z.array(zetroAgentTaskSchema) }));
export const zetroAgentTaskResponseSchema = zetroSuccessSchema(z.object({ task: zetroAgentTaskSchema }));

export const zetroChatStreamEventSchema = z.object({
  type: z.enum(["processing", "request", "review", "command", "change", "response", "error", "complete"]),
  message: z.string().min(1).max(20_000),
  raw: z.string().max(20_000).optional(),
});

export type ZetroChatConversation = z.infer<typeof zetroChatConversationSchema>;
export type ZetroIdeaStage = z.infer<typeof zetroIdeaStageSchema>;
export type ZetroChatMessage = z.infer<typeof zetroChatMessageSchema>;
export type ZetroChatConversationView = { conversation: ZetroChatConversation; messages: ZetroChatMessage[] };
export interface ZetroChatConversationReader {
  getConversation(id: string): ZetroChatConversationView | undefined;
}
export type ZetroChatAttachment = NonNullable<z.infer<typeof zetroCreateChatMessageSchema>["attachments"]>[number];
export type ZetroChatRole = z.infer<typeof zetroChatRoleSchema>;
export type ZetroChatStreamEvent = z.infer<typeof zetroChatStreamEventSchema>;
export type ZetroChatRuntime = z.infer<typeof zetroChatRuntimeSchema>;
export type ZetroChatRuntimeSelection = z.infer<typeof zetroChatRuntimeSelectionSchema>;
export type ZetroCodexDeviceCode = z.infer<typeof zetroCodexDeviceCodeSchema>;
export type ZetroIdeaBrief = z.infer<typeof zetroIdeaBriefSchema>;
export type ZetroUpsertIdeaBrief = z.infer<typeof zetroUpsertIdeaBriefSchema>;
export interface ZetroFinalBriefReader {
  getFinalBrief(id: string): ZetroIdeaBrief;
}
export type ZetroAgentTask = z.infer<typeof zetroAgentTaskSchema>;
export type ZetroCreateAgentTask = z.infer<typeof zetroCreateAgentTaskSchema>;
