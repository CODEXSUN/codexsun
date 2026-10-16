import { z } from "zod";

const attachmentSchema = z
  .object({
    base64: z.string().min(1),
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120)
  })
  .strict();

export const chatChannelSchema = z
  .object({
    kind: z.enum(["channel", "dm", "group", "broadcast"]),
    members: z.array(z.email().max(191)).max(200).default([]),
    name: z.string().trim().min(1, "Channel name is required.").max(120)
  })
  .strict();

export const chatChannelRenameSchema = z
  .object({ name: z.string().trim().min(1, "Channel name is required.").max(120) })
  .strict();

export const chatMemberSchema = z
  .object({
    role: z.enum(["admin", "member"]).default("member"),
    userEmail: z.email("Member email must be a valid email address.")
  })
  .strict();

export const chatMessageSchema = z
  .object({
    attachments: z.array(attachmentSchema).max(5),
    body: z.string(),
    channelUuid: z.string().min(1)
  })
  .strict();

export const chatMessageUpdateSchema = z
  .object({ body: z.string().trim().min(1, "Message body is required.") })
  .strict();
