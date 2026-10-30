import { z } from "zod";
export const commentBodySchema = z.string().trim().min(1, "Enter a comment.").max(10000);
