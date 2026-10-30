export type ImageStatus = "active" | "inactive";
export type ImageProductOption = { id: number; title: string };
export type ImageVariantOption = {
  id: number;
  productInformationId: number;
  title: string;
  sku: string;
};
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
  status: ImageStatus;
  createdAt: string;
  updatedAt: string;
};
export type ProductImagePayload = Omit<
  ProductImageRecord,
  "id" | "uuid" | "productTitle" | "variantTitle" | "createdAt" | "updatedAt"
>;
