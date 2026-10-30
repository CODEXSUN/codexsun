import { z } from "zod";
export const messageInput = z.object({ body: z.string().trim().min(1).max(4000) }).strict();
