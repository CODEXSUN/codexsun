import { z } from "zod";

export const zetroApiVersion = "v1" as const;

export const zetroHealthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.literal("zetro"),
  providers: z.array(z.string()),
  database: z.enum(["ok", "unavailable"]),
});

export const zetroSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
    version: z.literal(zetroApiVersion),
  });

export const zetroHealthResponseSchema = zetroSuccessSchema(zetroHealthSchema);

export type ZetroHealth = z.infer<typeof zetroHealthSchema>;
export type ZetroHealthResponse = z.infer<typeof zetroHealthResponseSchema>;

export interface ZetroSqliteReadiness {
  check(): Promise<boolean>;
}
