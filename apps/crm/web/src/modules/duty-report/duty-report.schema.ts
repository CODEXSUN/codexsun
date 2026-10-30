import { z } from "zod";
export const dutyReportEditSchema = z.object({
  performedDate: z.string().date(),
  actions: z.string().trim().min(1, "Actions are required.").max(10000)
});
export const dutyReportCreateSchema = dutyReportEditSchema.extend({
  assignmentId: z.number().int().positive()
});
