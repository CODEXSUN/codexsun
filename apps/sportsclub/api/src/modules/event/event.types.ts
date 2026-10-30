import type { z } from "zod";
import type {
  eventListQuerySchema,
  eventListResponseSchema,
  eventPayloadSchema,
  eventRecordSchema,
  eventSelectableColumns,
  publicEventSchema
} from "./event.schema.js";

export type EventPayload = z.infer<typeof eventPayloadSchema>;
export type EventRecord = z.infer<typeof eventRecordSchema>;
export type PublicEvent = z.infer<typeof publicEventSchema>;
export type EventSelectableColumn = (typeof eventSelectableColumns)[number];
export type EventListQuery = z.input<typeof eventListQuerySchema>;
export type EventListResponse = z.infer<typeof eventListResponseSchema>;
