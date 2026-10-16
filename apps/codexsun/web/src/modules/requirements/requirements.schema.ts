import { z } from "zod";
export const requirementFieldsSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a title.").max(200),
    description: z.string().trim().min(1, "Describe your request.").max(20000),
    priority: z.enum(["low", "normal", "high", "urgent"])
  })
  .strict();
export const requirementDraftSchema = requirementFieldsSchema
  .extend({
    clientKey: z.string().uuid(),
    origin: z.enum(["web", "desktop", "mobile"])
  })
  .strict();
