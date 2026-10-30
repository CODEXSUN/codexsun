import { z } from "zod";
export const whatsAppMessageSchema = z.string().trim().min(1, "Enter a message.").max(10000);
