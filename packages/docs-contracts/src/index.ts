import { z } from "zod";

export const docsApiVersion = "v1" as const;

export const docsHealthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.literal("docs"),
  providers: z.array(z.string()),
});

export const docsSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    version: z.literal(docsApiVersion),
  });

export const docsApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
  version: z.literal(docsApiVersion),
});

export const docsHealthResponseSchema = docsSuccessSchema(docsHealthSchema);

export type DocsHealth = z.infer<typeof docsHealthSchema>;
export type DocsHealthResponse = z.infer<typeof docsHealthResponseSchema>;
export type DocsApiError = z.infer<typeof docsApiErrorSchema>;
