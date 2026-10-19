import { z } from "zod";

export const sourceSchema = z
  .object({
    label: z.string().trim().min(1, "Connection name is required.").max(120),
    host: z.string().trim().min(1, "Host is required.").max(253),
    port: z.number().int().min(1).max(65535),
    database: z
      .string()
      .max(64, "Database name is too long.")
      .refine(
        (name) =>
          [...name].every((char) => char.charCodeAt(0) >= 32 && char !== "/" && char !== "\\"),
        "Use a valid database name."
      ),
    user: z.string().trim().min(1, "User is required.").max(191),
    password: z.string().min(1, "Password is required."),
    tlsMode: z.enum(["required", "disabled"])
  })
  .strict();

export const sourceUpdateSchema = sourceSchema.extend({ password: z.string().optional() });

export const transferSchema = z
  .object({
    sourceId: z.number().int().positive(),
    targetTenantId: z.number().int().positive(),
    table: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u)
  })
  .strict();
