import type { z } from "zod";
import type {
  publicSessionSchema,
  sessionListQuerySchema,
  sessionListResponseSchema,
  sessionPayloadSchema,
  sessionRecordSchema,
  sessionSelectableColumns
} from "./session.schema.js";

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
export type SessionRecord = z.infer<typeof sessionRecordSchema>;
export type PublicSession = z.infer<typeof publicSessionSchema>;
export type SessionSelectableColumn = (typeof sessionSelectableColumns)[number];
export type SessionListQuery = z.input<typeof sessionListQuerySchema>;
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;
