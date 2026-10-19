import type { z } from "zod";
import type {
  programPayloadSchema,
  programRecordSchema,
  publicProgramSchema
} from "./program.schema.js";

export type ProgramPayload = z.infer<typeof programPayloadSchema>;
export type ProgramRecord = z.infer<typeof programRecordSchema>;
export type PublicProgram = z.infer<typeof publicProgramSchema>;
