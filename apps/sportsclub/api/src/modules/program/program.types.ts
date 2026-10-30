import type { z } from "zod";
import type {
  programListQuerySchema,
  programListResponseSchema,
  programPayloadSchema,
  programRecordSchema,
  programSelectableColumns,
  publicProgramSchema
} from "./program.schema.js";

export type ProgramPayload = z.infer<typeof programPayloadSchema>;
export type ProgramRecord = z.infer<typeof programRecordSchema>;
export type PublicProgram = z.infer<typeof publicProgramSchema>;
export type ProgramSelectableColumn = (typeof programSelectableColumns)[number];
export type ProgramListQuery = z.input<typeof programListQuerySchema>;
export type ProgramListResponse = z.infer<typeof programListResponseSchema>;
