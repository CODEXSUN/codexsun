export type ProductVariantStatus = "active" | "inactive";
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
  status: ProductVariantStatus;
  createdAt: string;
  updatedAt: string;
};
export type ProductVariantSaveInput = Omit<
  ProductVariantRecord,
  "id" | "uuid" | "productTitle" | "createdAt" | "updatedAt"
>;
export type ProductVariantFilters = {
  productInformationId?: number;
  search?: string;
  status?: ProductVariantStatus;
};
export type ProductInformationOption = { id: number; title: string };
