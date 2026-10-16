import { z } from "zod";
export const tableSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    seats: z.number().int().min(1).max(50),
    status: z.enum(["active", "inactive"])
  })
  .strict();
