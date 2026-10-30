import type { z } from "zod";
import type {
  attendanceListQuerySchema,
  attendanceListResponseSchema,
  attendancePayloadSchema,
  attendanceRecordSchema,
  attendanceSelectableColumns
} from "./attendance.schema.js";

export type AttendancePayload = z.infer<typeof attendancePayloadSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type AttendanceSelectableColumn = (typeof attendanceSelectableColumns)[number];
export type AttendanceListQuery = z.input<typeof attendanceListQuerySchema>;
export type AttendanceListResponse = z.infer<typeof attendanceListResponseSchema>;
