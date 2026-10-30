import { z } from "zod";
export const chatTelegramCredentialsSchema = z
  .object({
    apiId: z.coerce.number().int().positive("Enter your Telegram API ID.").max(2147483647),
    apiHash: z
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{32}$/, "Enter the 32-character API hash from Telegram."),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+[1-9]\d{6,14}$/,
        "Enter your phone number with country code, for example +919876543210."
      )
  })
  .strict();
