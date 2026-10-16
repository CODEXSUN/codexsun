import { z } from "zod";

export const attendanceSchema = z
  .object({
    employeeId: z.string().regex(/^[0-9a-f]{8}$/),
    workDate: z.iso.date("Choose an attendance date."),
    status: z.enum(["present", "absent", "leave", "holiday"]),
    checkIn: z.string().nullable(),
    checkOut: z.string().nullable(),
    notes: z.string().trim().max(2000)
  })
  .superRefine((record, context) => {
    if (record.workDate > utcDate()) {
      context.addIssue({
        code: "custom",
        message: "Attendance date cannot be in the future.",
        path: ["workDate"]
      });
    }
    if (record.status === "present" && Boolean(record.checkIn) !== Boolean(record.checkOut)) {
      context.addIssue({
        code: "custom",
        message: "Enter both times or leave both blank.",
        path: ["checkOut"]
      });
    }
    if (record.checkIn && record.checkOut && record.checkOut <= record.checkIn) {
      context.addIssue({
        code: "custom",
        message: "Check-out must be later than check-in.",
        path: ["checkOut"]
      });
    }
    if (record.status !== "present" && (record.checkIn || record.checkOut)) {
      context.addIssue({
        code: "custom",
        message: "Times are only available for present employees.",
        path: ["checkIn"]
      });
    }
  });

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}
