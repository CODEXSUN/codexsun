import { z } from "zod";
export const requirementInput = z
  .object({
    title: z.string().trim().min(5).max(180),
    category: z.string().trim().min(2).max(100),
    description: z.string().trim().min(20).max(4000),
    quantity: z.string().trim().min(1).max(100),
    deliveryCity: z.string().trim().min(2).max(100),
    budget: z.number().min(0).max(1000000000).nullable(),
    status: z.enum(["draft", "open", "closed"])
  })
  .strict();
export const requirementRecord = requirementInput.extend({
  uuid: z.string(),
  createdAt: z.string()
});
export type RequirementInput = z.infer<typeof requirementInput>;
export type RequirementRecord = z.infer<typeof requirementRecord>;
