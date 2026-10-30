import type { z } from "zod";
import type {
  masterListQuerySchema,
  masterListResponseSchema,
  masterPayloadSchema,
  masterRecordSchema,
  masterSelectableColumns,
  publicMasterSchema
} from "./master.schema.js";

export type MasterPayload = z.infer<typeof masterPayloadSchema>;
export type MasterRecord = z.infer<typeof masterRecordSchema>;
export type PublicMaster = z.infer<typeof publicMasterSchema>;
export type MasterSelectableColumn = (typeof masterSelectableColumns)[number];
export type MasterListQuery = z.input<typeof masterListQuerySchema>;
export type MasterListResponse = z.infer<typeof masterListResponseSchema>;
