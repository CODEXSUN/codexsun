import type { z } from "zod";
import type {
  publicSessionSchema,
  sessionPayloadSchema,
  sessionRecordSchema
} from "./session.schema.js";

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
export type SessionRecord = z.infer<typeof sessionRecordSchema>;
export type PublicSession = z.infer<typeof publicSessionSchema>;
