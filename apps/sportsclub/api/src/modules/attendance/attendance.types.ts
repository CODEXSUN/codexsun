import type { z } from "zod";
import type {
  attendancePayloadSchema,
  attendanceRecordSchema
} from "./attendance.schema.js";

export type AttendancePayload = z.infer<typeof attendancePayloadSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
