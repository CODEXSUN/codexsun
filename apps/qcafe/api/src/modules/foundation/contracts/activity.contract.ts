import { z } from "zod";

export const commandContextSchema = z.object({
  actorId: z.string().trim().min(1).max(120),
  correlationId: z.string().uuid(),
});

export type CommandContext = z.infer<typeof commandContextSchema>;

export interface ActivityEventInput {
  readonly eventType: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly outcome?: "success" | "failure";
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface ActivityRecorder {
  record(context: CommandContext, event: ActivityEventInput): Promise<void>;
}
