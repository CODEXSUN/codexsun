import type { z } from "zod";
import type { quotationInput } from "./quotation.schema";
export type QuotationInput = z.infer<typeof quotationInput>;
export type Quotation = QuotationInput & {
  uuid: string;
  currency: "INR";
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "sent" | "withdrawn";
  createdAt: string;
  sellerName: string;
  buyerBusiness: string;
  requirementUuid: string | null;
  inquiryUuid: string | null;
  subject: string;
};
