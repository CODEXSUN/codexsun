import { z } from "zod";

export const enquiryStatusChange = z.strictObject({
  status: z.enum(["new", "in_progress", "resolved", "spam"]),
  revision: z.number().int().positive()
});
