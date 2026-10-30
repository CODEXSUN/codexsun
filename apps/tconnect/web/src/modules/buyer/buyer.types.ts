import type { Product } from "../product/product.types";
import type { Inquiry } from "../inquiry/inquiry.types";
export type Buyer = {
  uuid: string;
  name: string;
  email: string;
  businessName: string;
  city: string;
  phone: string;
  status: "active" | "inactive";
};
export type CatalogProduct = Product & {
  sellerName: string;
  sellerSlug: string;
  city: string;
  industry: string;
};
export type BuyerInquiryInput = {
  companyUuid: string;
  productUuid: string | null;
  requirementUuid: string | null;
  phone: string;
  requirement: string;
  quantity: string;
  consent: true;
};
export type SentInquiry = Inquiry & {
  sellerName: string;
  productUuid: string | null;
  requirementUuid: string | null;
};
export type TconnectBuyerTab =
  "catalog" | "requirements" | "enquiries" | "account" | "quotations" | "conversations";
