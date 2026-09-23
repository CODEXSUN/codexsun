import { z } from "zod";

export const agentKindSchema = z.literal("zxa");
export const agentStatusSchema = z.enum(["ready", "draining", "disabled"]);
export const assignmentStatusSchema = z.enum(["draft", "approved", "dispatched", "completed", "failed"]);

export const agentRegistrationSchema = z.object({
  apiUrl: z.string().url(),
  capacity: z.number().int().min(1).max(32).default(1),
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  protocolVersion: z.literal(1),
});

export const createAssignmentSchema = z.object({
  agentId: z.string().uuid(),
  cxforgeServerId: z.string().uuid(),
  ownedPaths: z.array(z.string().trim().min(1).max(512)).min(1).max(32),
  prompt: z.string().trim().min(1).max(16_000),
  title: z.string().trim().min(1).max(160),
});

export const assignmentParamsSchema = z.object({ id: z.string().uuid() });

export type AgentRegistration = z.infer<typeof agentRegistrationSchema>;
export type AgentStatus = z.infer<typeof agentStatusSchema>;
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;
export type CreateAssignment = z.infer<typeof createAssignmentSchema>;

export type AgentRecord = AgentRegistration & {
  createdAt: string;
  lastSeenAt: string;
  status: AgentStatus;
};

export type AssignmentRecord = CreateAssignment & {
  actorId: string;
  createdAt: string;
  id: string;
  result: string | null;
  revision: number;
  status: AssignmentStatus;
  updatedAt: string;
};
