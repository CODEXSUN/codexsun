import { z } from "zod";
const id = z.string().regex(/^[0-9a-f]{8}$/);
export const messageInput = z.object({ body: z.string().trim().min(1).max(4000) }).strict();
export const messageRecord = z.object({
  uuid: id,
  body: z.string(),
  senderSide: z.enum(["buyer", "seller"]),
  createdAt: z.string()
});
export const messagePage = z.object({
  messages: z.array(messageRecord),
  nextBefore: id.nullable()
});
export type MessageRecord = z.infer<typeof messageRecord>;
