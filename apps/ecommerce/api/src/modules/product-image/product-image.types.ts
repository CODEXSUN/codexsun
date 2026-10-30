export type ProductImageStatus = "active" | "inactive";
export type ProductImageRecord = {
  id: number;
  uuid: string;
  productInformationId: number;
  productTitle: string;
  variantId: number | null;
  variantTitle: string | null;
  url: string;
  altText: string;
  caption: string;
  sortOrder: number;
  isPrimary: boolean;
  status: ProductImageStatus;
  createdAt: string;
  updatedAt: string;
};
export type ProductImageSaveInput = Omit<
  ProductImageRecord,
  "id" | "uuid" | "productTitle" | "variantTitle" | "createdAt" | "updatedAt"
>;
export type ProductImageFilters = {
  productInformationId?: number;
  search?: string;
  status?: ProductImageStatus;
};
export type ImageProductOption = { id: number; title: string };
export type ImageVariantOption = {
  id: number;
  productInformationId: number;
  title: string;
  sku: string;
};
