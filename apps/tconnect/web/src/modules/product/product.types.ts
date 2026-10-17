export type Product = {
  uuid: string;
  companyUuid: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  unit: string;
  minimumOrder: string;
  imageDataUrl: string;
  status: "active" | "inactive";
};
export type ProductInput = Omit<Product, "uuid">;

export type PublicCatalogProduct = Product & {
  sellerName: string;
  sellerSlug: string;
  city: string;
  industry: string;
};
