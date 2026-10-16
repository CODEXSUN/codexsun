import { z } from "zod";

export const designationSchema = z
  .object({
    name: z.string().trim().min(1, "Designation name is required.").max(120),
    description: z.string().trim().max(500),
    status: z.enum(["active", "inactive"])
  })
  .strict();
