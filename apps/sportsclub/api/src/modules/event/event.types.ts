import type { z } from "zod";
import type {
  eventPayloadSchema,
  eventRecordSchema,
  publicEventSchema
} from "./event.schema.js";

export type EventPayload = z.infer<typeof eventPayloadSchema>;
export type EventRecord = z.infer<typeof eventRecordSchema>;
export type PublicEvent = z.infer<typeof publicEventSchema>;
