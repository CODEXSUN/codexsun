import { z } from "zod";
export const dutyAssignmentSchema = z
  .object({
    sopItemId: z.number().int().positive(),
    revisionId: z.number().int().positive(),
    assigneeUserId: z.number().int().positive(),
    displayOrder: z.number().int().min(0),
    startDate: z.string().date(),
    endDate: z.string().date().nullable()
  })
  .refine(
    (value) => !value.endDate || value.endDate >= value.startDate,
    "End date must not precede start date."
  );
