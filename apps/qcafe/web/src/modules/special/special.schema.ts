import { z } from "zod";
const prefix = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Enter a special prefix.")
  .max(20)
  .regex(/^[A-Z0-9_-]+$/u, "Use letters, numbers, dashes, or underscores.");
export const specialDefinitionSchema = z
  .object({
    prefix,
    name: z.string().trim().min(1, "Enter a special name.").max(100),
    isEnabled: z.boolean()
  })
  .strict();
export const specialSettingsSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    enabled: z.boolean(),
    selectedPrefix: z.union([z.literal(""), prefix]),
    definitions: z.array(specialDefinitionSchema).max(50)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.definitions.map((item) => item.prefix)).size !== value.definitions.length)
      ctx.addIssue({ code: "custom", message: "Special prefixes must be unique." });
    if (
      value.selectedPrefix &&
      !value.definitions.some((item) => item.prefix === value.selectedPrefix && item.isEnabled)
    )
      ctx.addIssue({ code: "custom", message: "Choose an enabled Today Special." });
    if (value.enabled && !value.selectedPrefix)
      ctx.addIssue({ code: "custom", message: "Select a Today Special before enabling it." });
  });
