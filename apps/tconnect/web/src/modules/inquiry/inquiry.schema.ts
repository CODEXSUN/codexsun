import { z } from "zod";
export const inquirySchema = z.object({
  companyUuid: z.string().regex(/^[0-9a-f]{8}$/),
  buyerName: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email."),
  phone: z.string().trim().min(7, "Enter your contact number."),
  requirement: z.string().trim().min(20, "Describe your requirement in at least 20 characters."),
  quantity: z.string().trim().min(1, "Enter an expected quantity."),
  consent: z.literal(true, { error: "Please consent to sharing these details." }),
  website: z.literal("")
});
