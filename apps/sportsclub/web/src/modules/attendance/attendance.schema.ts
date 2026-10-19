import { z } from "zod";

export const attendanceSchema = z.object({
  sessionUuid: z.string().trim().min(1, "Training session is required"),
  memberUuid: z.string().trim().min(1, "Student member is required"),
  sessionDate: z.string().trim().min(1, "Session date is required"),
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().nullable().optional()
});

export type AttendanceSchemaType = z.infer<typeof attendanceSchema>;
