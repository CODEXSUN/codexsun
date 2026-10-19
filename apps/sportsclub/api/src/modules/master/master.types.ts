import type { z } from "zod";
import type {
  masterPayloadSchema,
  masterRecordSchema,
  publicMasterSchema
} from "./master.schema.js";

export type MasterPayload = z.infer<typeof masterPayloadSchema>;
export type MasterRecord = z.infer<typeof masterRecordSchema>;
export type PublicMaster = z.infer<typeof publicMasterSchema>;
