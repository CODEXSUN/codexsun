export type VariantStatus = "active" | "inactive";
export type CatalogProductOption = { id: number; title: string };
export type ProductVariantRecord = {
  id: number;
  uuid: string;
  productInformationId: number;
  productTitle: string;
  sku: string;
  title: string;
  barcode: string;
  option1Name: string;
  option1Value: string;
  option2Name: string;
  option2Value: string;
  option3Name: string;
  option3Value: string;
  priceAdjustment: number;
  compareAtAdjustment: number;
  costAdjustment: number;
  weight: number;
  sortOrder: number;
  status: VariantStatus;
  createdAt: string;
  updatedAt: string;
};
export type ProductVariantPayload = Omit<
  ProductVariantRecord,
  "id" | "uuid" | "productTitle" | "createdAt" | "updatedAt"
>;
