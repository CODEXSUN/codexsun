import { z } from "zod";

export const noteSaveSchema = z
  .object({
    body: z.string().trim().min(1, "Note body is required."),
    title: z.string().trim().min(1, "Note title is required.").max(240)
  })
  .strict();
