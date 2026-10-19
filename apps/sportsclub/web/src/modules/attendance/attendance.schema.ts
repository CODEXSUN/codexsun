import { z } from "zod";
export const attendanceSchema = z.strictObject({
  sessionUuid: z.string().regex(/^[a-f0-9]{8}$/, "Choose a session"),
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/, "Choose a member"),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  status: z.enum(["present", "absent", "excused", "late"]),
  remarks: z.string().trim().max(500)
});
export type AttendanceSchemaType = z.infer<typeof attendanceSchema>;
