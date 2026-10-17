import { z } from "zod";
export const productInput = z
  .object({
    companyUuid: z.string().regex(/^[0-9a-f]{8}$/),
    name: z.string().trim().min(2).max(160),
    category: z.string().trim().min(2).max(80),
    description: z.string().trim().min(10).max(5000),
    price: z.number().min(0).max(1000000000).nullable(),
    unit: z.string().trim().min(1).max(40),
    minimumOrder: z.string().trim().min(1).max(100),
    imageDataUrl: z
      .string()
      .max(210000)
      .regex(/^(?:data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})?$/),
    status: z.enum(["active", "inactive"])
  })
  .strict();
